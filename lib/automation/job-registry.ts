import { getKV } from '@/lib/kv';
import {
  getAutomationConfig,
  getDeploymentId,
  getRuntimeEnvironment,
} from './config';
import type {
  AutomationHealthStatus,
  AutomationJobDefinition,
  AutomationJobState,
  ErrorCategory,
} from './types';

const JOB_PREFIX = 'automation:job:';
const JOB_INDEX_KEY = 'automation:job-index';

/** Built-in job definitions for Buffer automation on this site. */
export const AUTOMATION_JOB_DEFINITIONS: AutomationJobDefinition[] = [
  {
    name: 'buffer-blog-posts',
    jobType: 'buffer_schedule',
    description: 'Daily Buffer scheduler for REPUK blog posts',
    enabled: true,
    expectedSchedule: '5 5 * * *',
    expectedExecutionsPerDay: 1,
    expectedDailyQuota: 5,
    allowedWindowStartHourUtc: 5,
    allowedWindowEndHourUtc: 7,
    maxRetries: 3,
    maxToleratedDelayMinutes: 45,
  },
  {
    name: 'buffer-verify',
    jobType: 'buffer_verify',
    description: 'Verify today schedule and gap-fill under-quota days',
    enabled: true,
    expectedSchedule: '35 5 * * *',
    expectedExecutionsPerDay: 1,
    expectedDailyQuota: 5,
    allowedWindowStartHourUtc: 5,
    allowedWindowEndHourUtc: 7,
    maxRetries: 2,
    maxToleratedDelayMinutes: 45,
  },
  {
    name: 'buffer-daily-report',
    jobType: 'buffer_report',
    description: 'Verify yesterday Buffer posts reached sent status',
    enabled: true,
    expectedSchedule: '30 4 * * *',
    expectedExecutionsPerDay: 1,
    allowedWindowStartHourUtc: 4,
    allowedWindowEndHourUtc: 6,
    maxRetries: 1,
    maxToleratedDelayMinutes: 60,
  },
  {
    name: 'buffer-cross-site-report',
    jobType: 'buffer_report',
    description: 'Cross-site quota verification for all four properties',
    enabled: true,
    expectedSchedule: '45 4 * * *',
    expectedExecutionsPerDay: 1,
    expectedDailyQuota: 20,
    allowedWindowStartHourUtc: 4,
    allowedWindowEndHourUtc: 6,
    maxRetries: 1,
    maxToleratedDelayMinutes: 60,
  },
  {
    name: 'buffer-selftest',
    jobType: 'buffer_verify',
    description: 'Buffer scheduler self-test',
    enabled: true,
    expectedSchedule: '0 6 * * *',
    expectedExecutionsPerDay: 1,
    allowedWindowStartHourUtc: 6,
    allowedWindowEndHourUtc: 8,
    maxRetries: 1,
    maxToleratedDelayMinutes: 60,
  },
  {
    name: 'automation-daily-healthcheck',
    jobType: 'healthcheck',
    description: 'Authoritative daily automation health-check and self-heal',
    enabled: true,
    expectedSchedule: '15 7 * * *',
    expectedExecutionsPerDay: 1,
    allowedWindowStartHourUtc: 7,
    allowedWindowEndHourUtc: 9,
    maxRetries: 1,
    maxToleratedDelayMinutes: 90,
  },
  {
    name: 'automation-watchdog',
    jobType: 'watchdog',
    description: 'Hourly lightweight overdue/stuck/auth watchdog',
    enabled: true,
    expectedSchedule: '20 * * * *',
    expectedExecutionsPerDay: 24,
    allowedWindowStartHourUtc: 0,
    allowedWindowEndHourUtc: 24,
    maxRetries: 0,
    maxToleratedDelayMinutes: 90,
  },
];

function jobKey(name: string): string {
  return `${JOB_PREFIX}${name}`;
}

function emptyState(def: AutomationJobDefinition): AutomationJobState {
  return {
    ...def,
    lastAttemptedAt: null,
    lastSuccessfulAt: null,
    lastFailureAt: null,
    lastError: null,
    consecutiveFailureCount: 0,
    retryCount: 0,
    healthStatus: 'unknown',
    lockOwner: null,
    lockExpiresAt: null,
    lastHealthCheckAt: null,
    lastRepairAction: null,
    environment: getRuntimeEnvironment(),
    deploymentId: getDeploymentId(),
    updatedAt: new Date().toISOString(),
  };
}

export async function ensureJobRegistered(
  name: string,
): Promise<AutomationJobState> {
  const def = AUTOMATION_JOB_DEFINITIONS.find((j) => j.name === name);
  if (!def) {
    throw new Error(`Unknown automation job: ${name}`);
  }
  const existing = await getJobState(name);
  if (existing) return existing;
  const state = emptyState(def);
  await saveJobState(state);
  return state;
}

export async function ensureAllJobsRegistered(): Promise<AutomationJobState[]> {
  const out: AutomationJobState[] = [];
  for (const def of AUTOMATION_JOB_DEFINITIONS) {
    out.push(await ensureJobRegistered(def.name));
  }
  return out;
}

export async function getJobState(name: string): Promise<AutomationJobState | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<AutomationJobState>(jobKey(name))) ?? null;
}

export async function saveJobState(state: AutomationJobState): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  const next = {
    ...state,
    environment: getRuntimeEnvironment(),
    deploymentId: getDeploymentId(),
    updatedAt: new Date().toISOString(),
  };
  await kv.set(jobKey(state.name), next, { ex: 60 * 60 * 24 * 90 });
  try {
    await kv.sadd(JOB_INDEX_KEY, state.name);
  } catch {
    // Index is best-effort.
  }
}

export async function listJobStates(): Promise<AutomationJobState[]> {
  await ensureAllJobsRegistered();
  const out: AutomationJobState[] = [];
  for (const def of AUTOMATION_JOB_DEFINITIONS) {
    const state = (await getJobState(def.name)) ?? emptyState(def);
    out.push(state);
  }
  return out;
}

export async function recordJobAttempt(input: {
  name: string;
  ok: boolean;
  error?: string | null;
  repairAction?: string | null;
  healthStatus?: AutomationHealthStatus;
  errorCategory?: ErrorCategory | null;
}): Promise<AutomationJobState> {
  const state = await ensureJobRegistered(input.name);
  const now = new Date().toISOString();
  state.lastAttemptedAt = now;
  if (input.ok) {
    state.lastSuccessfulAt = now;
    state.consecutiveFailureCount = 0;
    state.retryCount = 0;
    state.lastError = null;
    state.healthStatus = input.healthStatus ?? 'healthy';
  } else {
    state.lastFailureAt = now;
    state.lastError = input.error ?? 'unknown error';
    state.consecutiveFailureCount += 1;
    state.healthStatus = input.healthStatus ?? 'failing';
  }
  if (input.repairAction) state.lastRepairAction = input.repairAction;
  await saveJobState(state);
  return state;
}

export async function markJobHealthChecked(
  name: string,
  healthStatus: AutomationHealthStatus,
  repairAction?: string | null,
): Promise<void> {
  const state = await ensureJobRegistered(name);
  state.lastHealthCheckAt = new Date().toISOString();
  state.healthStatus = healthStatus;
  if (repairAction) state.lastRepairAction = repairAction;
  await saveJobState(state);
}

export function getJobDefinition(name: string): AutomationJobDefinition | undefined {
  return AUTOMATION_JOB_DEFINITIONS.find((j) => j.name === name);
}

/** Whether daily healthcheck should own consolidated reporting emails. */
export function isDailyHealthcheckOwningReports(): boolean {
  return getAutomationConfig().dailyHealthcheckEnabled;
}
