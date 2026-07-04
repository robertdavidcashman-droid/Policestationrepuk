import type { ScheduleResult } from '@robertcashman/buffer-engine';

/** Benign skip — log only, never email. */
export function shouldSendSchedulerSkippedEmail(_result: ScheduleResult): boolean {
  return false;
}

/** Only send failure email for genuine final failures, not reconciled/covered days. */
export function shouldSendSchedulerFailureEmail(
  result: Pick<ScheduleResult, 'ok' | 'reconciled' | 'skipped' | 'reason'>,
): boolean {
  if (result.ok || result.skipped || result.reconciled) return false;
  return true;
}

export function shouldSendSchedulerFailureForError(error: string): boolean {
  if (/too many requests/i.test(error)) return false;
  return true;
}

export function logSchedulerLifecycle(
  stage: string,
  payload: Record<string, unknown>,
): void {
  console.info(`[buffer:scheduler-lifecycle] ${stage}`, payload);
}
