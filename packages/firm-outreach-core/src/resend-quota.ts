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

export function isTransientResendError(error?: string): boolean {
  if (!error) return false;
  const m = error.toLowerCase();
  if (m.includes('429') || m.includes('rate limit') || m.includes('too many requests')) {
    return true;
  }
  if (
    m.includes('timeout') ||
    m.includes('503') ||
    m.includes('502') ||
    m.includes('500') ||
    m.includes('econnreset') ||
    m.includes('network')
  ) {
    return true;
  }
  return false;
}

export function isPermanentResendError(error?: string): boolean {
  if (!error) return false;
  const m = error.toLowerCase();
  if (isTransientResendError(error)) return false;
  if (m.includes('invalid') || m.includes('bounce') || m.includes('not verified')) {
    return true;
  }
  if (m.includes('validation') || m.includes('forbidden') || m.includes('unauthorized')) {
    return true;
  }
  return m.includes('4') && !m.includes('429');
}
