/** Structured skip/failure reasons recorded during a send run. */
export type OutreachSkipReason =
  | 'no_step'
  | 'not_due'
  | 'no_email'
  | 'not_qualified'
  | 'suppressed'
  | 'duplicate'
  | 'idempotent_exists'
  | 'firm_cooldown'
  | 'mx_invalid'
  | 'resend_quota'
  | 'daily_cap'
  | 'hourly_cap'
  | 'send_disabled'
  | 'resend_error'
  | 'transient_resend_error'
  | 'permanent_resend_error'
  | 'no_resend'
  | 'job_claim_failed'
  | 'quiet_hours'
  | 'test_redirect';

export interface OutreachFailureRecord {
  email: string;
  firmName?: string;
  prospectId?: string;
  reason: string;
  transient?: boolean;
}

export interface OutreachRunLog {
  campaignId: string;
  startedAt: string;
  finishedAt: string;
  dryRun: boolean;
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
  suppressed: number;
  skipReasons: Partial<Record<OutreachSkipReason, number>>;
  failures: OutreachFailureRecord[];
  elapsedMs: number;
  dailyCap: number;
  sentTodayBefore: number;
  resendQuotaRemaining?: number;
}

export function createEmptySkipReasons(): Partial<Record<OutreachSkipReason, number>> {
  return {};
}

export function bumpSkipReason(
  map: Partial<Record<OutreachSkipReason, number>>,
  reason: OutreachSkipReason,
): void {
  map[reason] = (map[reason] ?? 0) + 1;
}
