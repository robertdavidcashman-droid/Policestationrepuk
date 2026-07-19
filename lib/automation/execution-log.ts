import { randomUUID } from 'node:crypto';
import { getKV } from '@/lib/kv';
import { saveCronRunLog } from '@/lib/cron-run-log';
import {
  getDeploymentId,
  getRuntimeEnvironment,
} from './config';
import { logAutomationEvent } from './observability';
import type {
  ExecutionCounts,
  ExecutionRecord,
  ExecutionStatus,
  ErrorCategory,
} from './types';

const EXEC_PREFIX = 'automation:exec:';
const EXEC_DAY_PREFIX = 'automation:exec-day:';
const LATEST_PREFIX = 'automation:exec-latest:';
const EXEC_TTL = 60 * 60 * 24 * 45;

export function createExecutionId(): string {
  return randomUUID();
}

export function startExecution(input: {
  jobName: string;
  triggerSource: ExecutionRecord['triggerSource'];
  dryRun?: boolean;
  executionId?: string;
}): ExecutionRecord {
  return {
    executionId: input.executionId ?? createExecutionId(),
    jobName: input.jobName,
    triggerSource: input.triggerSource,
    environment: getRuntimeEnvironment(),
    deploymentId: getDeploymentId(),
    startedAt: new Date().toISOString(),
    completedAt: null,
    status: 'running',
    counts: {},
    externalIds: [],
    errorCategory: null,
    errorMessage: null,
    errorDetails: null,
    dryRun: Boolean(input.dryRun),
    repairs: [],
    notes: [],
  };
}

export async function saveExecution(record: ExecutionRecord): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(`${EXEC_PREFIX}${record.executionId}`, record, { ex: EXEC_TTL });
  await kv.set(`${LATEST_PREFIX}${record.jobName}`, record, { ex: EXEC_TTL });

  const day = record.startedAt.slice(0, 10);
  try {
    await kv.sadd(`${EXEC_DAY_PREFIX}${day}:${record.jobName}`, record.executionId);
    await kv.expire(`${EXEC_DAY_PREFIX}${day}:${record.jobName}`, EXEC_TTL);
  } catch {
    // best-effort index
  }
}

export async function completeExecution(
  record: ExecutionRecord,
  input: {
    status: ExecutionStatus;
    counts?: ExecutionCounts;
    externalIds?: string[];
    errorCategory?: ErrorCategory | null;
    errorMessage?: string | null;
    errorDetails?: string | null;
    repairs?: string[];
    notes?: string[];
  },
): Promise<ExecutionRecord> {
  const completed: ExecutionRecord = {
    ...record,
    completedAt: new Date().toISOString(),
    status: input.status,
    counts: { ...record.counts, ...input.counts },
    externalIds: input.externalIds ?? record.externalIds,
    errorCategory: input.errorCategory ?? record.errorCategory,
    errorMessage: input.errorMessage ?? record.errorMessage,
    errorDetails: input.errorDetails ?? record.errorDetails,
    repairs: input.repairs ?? record.repairs,
    notes: [...record.notes, ...(input.notes ?? [])],
  };
  await saveExecution(completed);

  // Mirror into existing cron-run-log for backwards compatibility.
  const outcome =
    completed.status === 'successful' || completed.status === 'repaired'
      ? 'success'
      : completed.status === 'partially_successful'
        ? 'partial'
        : completed.status === 'skipped_duplicate' || completed.status === 'blocked'
          ? 'skipped'
          : 'failed';

  await saveCronRunLog({
    jobName: completed.jobName,
    startedAt: completed.startedAt,
    finishedAt: completed.completedAt ?? new Date().toISOString(),
    durationMs:
      Date.parse(completed.completedAt ?? completed.startedAt) -
      Date.parse(completed.startedAt),
    outcome,
    skipReason:
      completed.status === 'skipped_duplicate' || completed.status === 'blocked'
        ? completed.errorMessage ?? completed.status
        : undefined,
    counts: completed.counts as Record<string, number>,
    errorCategory: completed.errorCategory ?? undefined,
    errorMessage: completed.errorMessage ?? undefined,
  });

  logAutomationEvent('automation.job.completed', {
    jobName: completed.jobName,
    executionId: completed.executionId,
    status: completed.status,
    dryRun: completed.dryRun,
  });

  return completed;
}

export async function getLatestExecution(
  jobName: string,
): Promise<ExecutionRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<ExecutionRecord>(`${LATEST_PREFIX}${jobName}`)) ?? null;
}

export async function getExecution(
  executionId: string,
): Promise<ExecutionRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<ExecutionRecord>(`${EXEC_PREFIX}${executionId}`)) ?? null;
}

export async function countExecutionsForDay(
  jobName: string,
  dayUtc: string,
): Promise<number> {
  const kv = getKV();
  if (!kv) return 0;
  try {
    const members = await kv.smembers(`${EXEC_DAY_PREFIX}${dayUtc}:${jobName}`);
    return Array.isArray(members) ? members.length : 0;
  } catch {
    return 0;
  }
}
