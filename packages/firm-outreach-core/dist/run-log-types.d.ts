export declare function createEmptySkipReasons(): Partial<Record<string, number>>;
export declare function bumpSkipReason(map: Partial<Record<string, number>>, reason: string): void;
export type OutreachSkipReason = 'no_step' | 'no_email' | 'not_qualified' | 'suppressed' | 'duplicate' | 'firm_cooldown' | 'mx_invalid' | 'resend_quota' | 'daily_cap' | 'send_disabled' | 'resend_error' | 'transient_resend_error' | 'permanent_resend_error' | 'no_resend';
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
