import { createHash } from 'node:crypto';
import { normalizeEmail } from './normalize';
import type { FirmProspect } from './types';

/** Durable email job lifecycle (KV-backed outbox). */
export type EmailJobStatus =
  | 'pending'
  | 'claimed'
  | 'processing'
  | 'accepted'
  | 'delivered'
  | 'deferred'
  | 'bounced'
  | 'complained'
  | 'unsubscribed'
  | 'suppressed'
  | 'failed'
  | 'retry_scheduled'
  | 'permanently_failed';

export const EMAIL_JOB_TERMINAL_STATUSES: ReadonlySet<EmailJobStatus> = new Set([
  'accepted',
  'delivered',
  'bounced',
  'complained',
  'unsubscribed',
  'suppressed',
  'permanently_failed',
]);

export const EMAIL_JOB_CLAIMABLE_STATUSES: ReadonlySet<EmailJobStatus> = new Set([
  'pending',
  'retry_scheduled',
]);

export const DEFAULT_EMAIL_JOB_MAX_ATTEMPTS = 5;
export const DEFAULT_EMAIL_JOB_LEASE_SECONDS = 120;
export const FOLLOWUP_DAY_1 = 7;
export const FOLLOWUP_DAY_2 = 21;
export const FIRM_SEND_COOLDOWN_DAYS = 90;

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

export function buildOutreachIdempotencyKey(
  campaignId: string,
  email: string,
  sequenceStep: number,
): string {
  const normalized = normalizeEmail(email);
  const material = `${campaignId.trim().toLowerCase()}|${normalized}|${sequenceStep}`;
  return createHash('sha256').update(material).digest('hex').slice(0, 40);
}

export function sequenceStepOf(prospect: Pick<FirmProspect, 'sequenceStep'>): number {
  const n = prospect.sequenceStep;
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

export function daysSince(iso: string | undefined, nowMs = Date.now()): number {
  if (!iso) return Infinity;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return Infinity;
  return (nowMs - t) / (1000 * 60 * 60 * 24);
}

export function dueForFollowUp(
  prospect: Pick<
    FirmProspect,
    'status' | 'sequenceStep' | 'lastEmailAt' | 'waLinkClickedAt' | 'joinedWhatsAppAt'
  >,
  nowMs = Date.now(),
): boolean {
  if (prospect.waLinkClickedAt || prospect.joinedWhatsAppAt) return false;
  if (!prospect.lastEmailAt) return prospect.status === 'ready_to_send';

  const step = sequenceStepOf(prospect);
  const days = daysSince(prospect.lastEmailAt, nowMs);
  if (step === 0 && days >= FOLLOWUP_DAY_1) return true;
  if (step === 1 && days >= FOLLOWUP_DAY_2 - FOLLOWUP_DAY_1) return true;
  return false;
}

/**
 * Next sequence step for a prospect, or null when nothing is due.
 * Treats missing sequenceStep as 0 (legacy KV rows).
 */
export function nextOutreachStep(
  prospect: Pick<
    FirmProspect,
    'status' | 'sequenceStep' | 'lastEmailAt' | 'waLinkClickedAt' | 'joinedWhatsAppAt'
  >,
  nowMs = Date.now(),
): number | null {
  const step = sequenceStepOf(prospect);

  if (prospect.status === 'ready_to_send' && step === 0 && !prospect.lastEmailAt) {
    return 0;
  }

  // Stale ready+lastEmailAt: treat as sent for follow-up scheduling.
  const effectivelySent =
    prospect.status === 'sent' ||
    (prospect.status === 'ready_to_send' && Boolean(prospect.lastEmailAt));

  if (effectivelySent && step === 0 && dueForFollowUp(prospect, nowMs)) return 1;
  if (effectivelySent && step === 1 && dueForFollowUp(prospect, nowMs)) return 2;
  return null;
}

/** Exponential backoff with full jitter. attempt is 1-based. */
export function retryDelayMs(attempt: number, opts?: { baseMs?: number; maxMs?: number }): number {
  const base = opts?.baseMs ?? 30_000;
  const max = opts?.maxMs ?? 6 * 60 * 60 * 1000;
  const exp = Math.min(max, base * 2 ** Math.max(0, attempt - 1));
  return Math.floor(Math.random() * (exp + 1));
}

export function classifyProviderError(error?: string, statusCode?: number): RetryClass {
  if (statusCode != null) {
    if ([408, 409, 425, 429, 500, 502, 503, 504].includes(statusCode)) return 'transient';
    if (statusCode === 401 || statusCode === 403) return 'permanent';
    if (statusCode >= 400 && statusCode < 500) return 'permanent';
  }
  if (!error) return 'unknown';
  const m = error.toLowerCase();
  if (
    m.includes('429') ||
    m.includes('rate limit') ||
    m.includes('too many requests') ||
    m.includes('timeout') ||
    m.includes('timed out') ||
    m.includes('econnreset') ||
    m.includes('econnrefused') ||
    m.includes('enotfound') ||
    m.includes('dns') ||
    m.includes('network') ||
    m.includes('temporarily') ||
    m.includes('try again') ||
    m.includes('503') ||
    m.includes('502') ||
    m.includes('500') ||
    m.includes('504') ||
    m.includes('408') ||
    m.includes('425')
  ) {
    return 'transient';
  }
  if (
    m.includes('invalid') ||
    m.includes('bounce') ||
    m.includes('not verified') ||
    m.includes('unsubscribed') ||
    m.includes('complaint') ||
    m.includes('suppressed') ||
    m.includes('forbidden') ||
    m.includes('unauthorized') ||
    m.includes('validation') ||
    m.includes('no_email') ||
    m.includes('no_resend') ||
    m.includes('no_message_id')
  ) {
    return 'permanent';
  }
  return 'unknown';
}

export function isRetryableProviderError(error?: string, statusCode?: number): boolean {
  return classifyProviderError(error, statusCode) === 'transient';
}
