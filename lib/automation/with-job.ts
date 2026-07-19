import { getAutomationConfig } from './config';
import { classifyError } from './errors';
import {
  completeExecution,
  createExecutionId,
  saveExecution,
  startExecution,
} from './execution-log';
import { acquireJobLock, releaseJobLock } from './lock';
import { logAutomationEvent } from './observability';
import { recordJobAttempt } from './job-registry';
import type { ExecutionRecord, ExecutionStatus } from './types';

export interface WithAutomationJobResult<T> {
  ok: boolean;
  skipped: boolean;
  reason?: string;
  execution: ExecutionRecord | null;
  result?: T;
}

/**
 * Wrap a cron/manual job with lock + execution logging + registry updates.
 */
export type AutomationJobRunOutcome<T> = {
  status: ExecutionStatus;
  result: T;
  counts?: ExecutionRecord['counts'];
  externalIds?: string[];
  errorMessage?: string | null;
  notes?: string[];
  repairs?: string[];
};

export async function withAutomationJob<T = unknown>(input: {
  jobName: string;
  triggerSource: ExecutionRecord['triggerSource'];
  dryRun?: boolean;
  /** Skip lock (nested calls from healthcheck). */
  skipLock?: boolean;
  run: (ctx: {
    executionId: string;
    dryRun: boolean;
  }) => Promise<AutomationJobRunOutcome<T>>;
}): Promise<WithAutomationJobResult<T>> {
  const config = getAutomationConfig();
  if (!config.enabled && input.jobName.startsWith('automation-')) {
    return {
      ok: true,
      skipped: true,
      reason: 'automation_disabled',
      execution: null,
    };
  }

  const executionId = createExecutionId();
  const dryRun = input.dryRun ?? false;

  if (!input.skipLock) {
    const lock = await acquireJobLock(input.jobName, executionId);
    if (!lock) {
      return {
        ok: true,
        skipped: true,
        reason: 'lock_held',
        execution: null,
      };
    }
  }

  const execution = startExecution({
    jobName: input.jobName,
    triggerSource: input.triggerSource,
    dryRun,
    executionId,
  });
  await saveExecution(execution);
  logAutomationEvent('automation.job.started', {
    jobName: input.jobName,
    executionId,
    triggerSource: input.triggerSource,
    dryRun,
  });

  try {
    const outcome = await input.run({ executionId, dryRun });
    const completed = await completeExecution(execution, {
      status: outcome.status,
      counts: outcome.counts,
      externalIds: outcome.externalIds,
      errorMessage: outcome.errorMessage,
      notes: outcome.notes,
      repairs: outcome.repairs,
    });

    const ok =
      outcome.status === 'successful' ||
      outcome.status === 'repaired' ||
      outcome.status === 'partially_successful' ||
      outcome.status === 'skipped_duplicate';

    await recordJobAttempt({
      name: input.jobName,
      ok,
      error: outcome.errorMessage,
      repairAction: outcome.repairs?.[0] ?? null,
      healthStatus: ok ? 'healthy' : 'failing',
    });

    return { ok, skipped: false, execution: completed, result: outcome.result };
  } catch (err) {
    const classified = classifyError(err);
    const completed = await completeExecution(execution, {
      status: classified.requiresHumanAction ? 'requires_human_action' : 'failed',
      errorCategory: classified.category,
      errorMessage: classified.message,
      errorDetails: err instanceof Error ? err.stack?.slice(0, 2000) ?? null : null,
    });
    await recordJobAttempt({
      name: input.jobName,
      ok: false,
      error: classified.message,
      errorCategory: classified.category,
      healthStatus: 'failing',
    });
    return {
      ok: false,
      skipped: false,
      reason: classified.message,
      execution: completed,
    };
  } finally {
    if (!input.skipLock) {
      await releaseJobLock(input.jobName, executionId);
    }
  }
}
