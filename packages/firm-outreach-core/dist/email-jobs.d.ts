import type { FirmProspect } from './types';
/** Durable email job lifecycle (KV-backed outbox). */
export type EmailJobStatus = 'pending' | 'claimed' | 'processing' | 'accepted' | 'delivered' | 'deferred' | 'bounced' | 'complained' | 'unsubscribed' | 'suppressed' | 'failed' | 'retry_scheduled' | 'permanently_failed';
export declare const EMAIL_JOB_TERMINAL_STATUSES: ReadonlySet<EmailJobStatus>;
export declare const EMAIL_JOB_CLAIMABLE_STATUSES: ReadonlySet<EmailJobStatus>;
export declare const DEFAULT_EMAIL_JOB_MAX_ATTEMPTS = 5;
export declare const DEFAULT_EMAIL_JOB_LEASE_SECONDS = 120;
export declare const FOLLOWUP_DAY_1 = 7;
export declare const FOLLOWUP_DAY_2 = 21;
export declare const FIRM_SEND_COOLDOWN_DAYS = 90;
export interface EmailJob {
    id: string;
    idempotencyKey: string;
    campaignId: string;
    prospectId: string;
    firmName: string;
    prospectType: FirmProspect['prospectType'];
    email: string;
    sequenceStep: number;
    status: EmailJobStatus;
    attemptCount: number;
    maxAttempts: number;
    providerMessageId?: string;
    lastError?: string;
    lastErrorCode?: string;
    providerStatusCode?: number;
    nextRetryAt?: string;
    claimedAt?: string;
    claimOwner?: string;
    claimExpiresAt?: string;
    firstAttemptAt?: string;
    acceptedAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
    correlationId: string;
    runId?: string;
    sendId?: string;
    subject?: string;
    dryRun?: boolean;
}
export type RetryClass = 'transient' | 'permanent' | 'unknown';
export declare function buildOutreachIdempotencyKey(campaignId: string, email: string, sequenceStep: number): string;
export declare function sequenceStepOf(prospect: Pick<FirmProspect, 'sequenceStep'>): number;
export declare function daysSince(iso: string | undefined, nowMs?: number): number;
export declare function dueForFollowUp(prospect: Pick<FirmProspect, 'status' | 'sequenceStep' | 'lastEmailAt' | 'waLinkClickedAt' | 'joinedWhatsAppAt'>, nowMs?: number): boolean;
/**
 * Next sequence step for a prospect, or null when nothing is due.
 * Treats missing sequenceStep as 0 (legacy KV rows).
 */
export declare function nextOutreachStep(prospect: Pick<FirmProspect, 'status' | 'sequenceStep' | 'lastEmailAt' | 'waLinkClickedAt' | 'joinedWhatsAppAt'>, nowMs?: number): number | null;
/** Exponential backoff with full jitter. attempt is 1-based. */
export declare function retryDelayMs(attempt: number, opts?: {
    baseMs?: number;
    maxMs?: number;
}): number;
export declare function classifyProviderError(error?: string, statusCode?: number): RetryClass;
export declare function isRetryableProviderError(error?: string, statusCode?: number): boolean;
//# sourceMappingURL=email-jobs.d.ts.map