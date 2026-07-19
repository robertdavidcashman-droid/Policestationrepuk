import { classifyError, isRetryableError } from './errors';
import { getAutomationConfig } from './config';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Honour Retry-After seconds from an error if present */
  getRetryAfterMs?: (error: unknown) => number | null;
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
  /** When false, do not retry (dry-run / disabled). */
  enabled?: boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(ms: number): number {
  const spread = Math.floor(ms * 0.2);
  return ms + Math.floor(Math.random() * (spread * 2 + 1)) - spread;
}

export function extractRetryAfterMs(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const ext = (error as { details?: Array<{ extensions?: { retryAfter?: number } }> }).details;
  if (Array.isArray(ext)) {
    for (const item of ext) {
      const retryAfter = item?.extensions?.retryAfter;
      if (typeof retryAfter === 'number' && retryAfter > 0) return retryAfter * 1000;
    }
  }
  const msg = error instanceof Error ? error.message : String(error);
  const m = /retry[- ]after[:\s]+(\d+)/i.exec(msg);
  if (m) return Number(m[1]) * 1000;
  return null;
}

/**
 * Execute fn with exponential backoff + jitter for transient errors.
 * Permanent errors (auth/validation/config) are not retried.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const config = getAutomationConfig();
  const maxRetries = options.maxRetries ?? config.maxRetryCount;
  const baseDelayMs = options.baseDelayMs ?? 2000;
  const maxDelayMs = options.maxDelayMs ?? 60_000;
  const enabled = options.enabled ?? config.autoRetryEnabled;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const classified = classifyError(err);
      if (!enabled || !classified.retryable || !isRetryableError(err) || attempt >= maxRetries) {
        throw err;
      }
      const retryAfter =
        options.getRetryAfterMs?.(err) ?? extractRetryAfterMs(err);
      const expo = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const delayMs = retryAfter && retryAfter > 0 ? retryAfter : jitter(expo);
      options.onRetry?.(attempt + 1, err, delayMs);
      await sleep(delayMs);
    }
  }
  throw lastError;
}
