/** Shared Resend free-tier ceiling — both workspaces share one API key. */
export const DEFAULT_RESEND_DAILY_LIMIT = 100;

/** Headroom reserved for login codes, digests, Kent corrections, etc. */
export const DEFAULT_RESEND_HEADROOM = 10;

export const RESEND_COUNT_KEY_PREFIX = 'firmoutreach:resend:count:';

export function resendQuotaKey(utcDate: string): string {
  return `${RESEND_COUNT_KEY_PREFIX}${utcDate}`;
}

export function resendDailyLimit(): number {
  return (
    Number(process.env.FIRM_OUTREACH_RESEND_DAILY_LIMIT ?? DEFAULT_RESEND_DAILY_LIMIT) ||
    DEFAULT_RESEND_DAILY_LIMIT
  );
}

export function resendDailyHeadroom(): number {
  return (
    Number(process.env.FIRM_OUTREACH_RESEND_HEADROOM ?? DEFAULT_RESEND_HEADROOM) ||
    DEFAULT_RESEND_HEADROOM
  );
}

/** Effective outreach budget across both sites for a UTC day. */
export function resendOutreachBudget(): number {
  return Math.max(0, resendDailyLimit() - resendDailyHeadroom());
}

export function resendQuotaRemaining(count: number): number {
  return Math.max(0, resendOutreachBudget() - count);
}

import { classifyProviderError } from './email-jobs';

export function isTransientResendError(error?: string, statusCode?: number): boolean {
  return classifyProviderError(error, statusCode) === 'transient';
}

export function isPermanentResendError(error?: string, statusCode?: number): boolean {
  return classifyProviderError(error, statusCode) === 'permanent';
}
