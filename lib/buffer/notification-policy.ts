import type { ScheduleResult } from '@robertcashman/buffer-engine';
import { classifyError, isPermanentError } from '@/lib/automation/errors';
import { isDailyHealthcheckOwningReports } from '@/lib/automation/job-registry';

/** Benign skip — log only, never email. */
export function shouldSendSchedulerSkippedEmail(_result: ScheduleResult): boolean {
  return false;
}

/**
 * Immediate failure emails are reserved for permanent errors (auth/config/validation).
 * Transient failures are left for the daily healthcheck / watchdog when that owns reporting.
 */
export function shouldSendSchedulerFailureEmail(
  result: Pick<ScheduleResult, 'ok' | 'reconciled' | 'skipped' | 'reason'>,
): boolean {
  if (result.ok || result.skipped || result.reconciled) return false;
  if (!result.reason) return !isDailyHealthcheckOwningReports();
  if (isDailyHealthcheckOwningReports()) {
    return isPermanentError(result.reason);
  }
  return true;
}

export function shouldSendSchedulerFailureForError(error: string): boolean {
  if (/too many requests/i.test(error)) return false;
  if (isDailyHealthcheckOwningReports()) {
    return classifyError(error).requiresHumanAction;
  }
  return true;
}

export function logSchedulerLifecycle(
  stage: string,
  payload: Record<string, unknown>,
): void {
  console.info(`[buffer:scheduler-lifecycle] ${stage}`, payload);
}
