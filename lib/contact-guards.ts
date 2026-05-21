/**
 * Anti-abuse for the public contact / enquiry / verification forms.
 *
 * Two layers of rate limiting:
 *   1. KV-backed sliding window (Upstash Redis) — survives across serverless
 *      instances. This is the authoritative limit when KV is configured.
 *   2. In-memory fallback — used in local dev / preview without KV. Per-
 *      instance only, so on Vercel it is best-effort.
 *
 * Both layers use the same 5-per-15-minutes default budget per IP, but the
 * scope key can be customised so different forms get separate buckets.
 */

import { getKV } from '@/lib/kv';

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 5;
const buckets = new Map<string, number[]>();

export function getClientIp(request: Request): string {
  const xf = request.headers.get('x-forwarded-for');
  if (xf) {
    const first = xf.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

function inMemoryRateLimitOk(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const prev = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (prev.length >= max) return false;
  prev.push(now);
  buckets.set(key, prev);
  if (buckets.size > 50_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t > windowMs)) buckets.delete(k);
    }
  }
  return true;
}

/** Returns true if this IP may submit (under the rolling limit). In-memory only. */
export function contactRateLimitOk(ip: string): boolean {
  return inMemoryRateLimitOk(`contact:${ip}`, RATE_MAX, RATE_WINDOW_MS);
}

/**
 * KV-backed sliding-window rate limiter. The KV key is a sorted set of
 * timestamps; we trim anything older than the window, count what remains, and
 * add the current timestamp if we're under the cap. This is the same pattern
 * Upstash recommends for cross-instance limiting.
 *
 * When KV is not configured this falls back to the in-memory limiter so
 * local dev keeps working.
 */
export async function rateLimitOk(opts: {
  ip: string;
  scope: string;
  max?: number;
  windowMs?: number;
}): Promise<{ ok: boolean; remaining: number }> {
  const max = opts.max ?? RATE_MAX;
  const windowMs = opts.windowMs ?? RATE_WINDOW_MS;
  const ip = opts.ip || 'unknown';
  const kv = getKV();

  if (!kv) {
    const ok = inMemoryRateLimitOk(`${opts.scope}:${ip}`, max, windowMs);
    return { ok, remaining: ok ? max - 1 : 0 };
  }

  const key = `rate:${opts.scope}:${ip}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  try {
    const pipeline = kv.pipeline();
    pipeline.zremrangebyscore(key, 0, cutoff);
    pipeline.zcard(key);
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random().toString(36).slice(2, 8)}` });
    pipeline.pexpire(key, windowMs);
    const results = (await pipeline.exec()) as unknown as [number, number, number, number];
    const countBeforeInsert = Number(results[1] ?? 0);
    if (countBeforeInsert >= max) {
      // We already inserted; remove the latest entry to keep the window honest.
      try {
        await kv.zremrangebyscore(key, now - 1, now);
      } catch {
        /* noop */
      }
      return { ok: false, remaining: 0 };
    }
    return { ok: true, remaining: Math.max(0, max - 1 - countBeforeInsert) };
  } catch (err) {
    console.warn('[rate-limit] KV failure, falling back to in-memory:', err);
    const ok = inMemoryRateLimitOk(`${opts.scope}:${ip}`, max, windowMs);
    return { ok, remaining: ok ? max - 1 : 0 };
  }
}

const MIN_ELAPSED_MS = 2_500;
const MAX_FORM_AGE_MS = 48 * 60 * 60 * 1000;
const MAX_LINKISH = 8;

export type ContactTimingResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export function validateContactTiming(_startedAt: unknown): ContactTimingResult {
  const t = typeof _startedAt === 'number' ? _startedAt : Number(_startedAt);
  if (!Number.isFinite(t) || t <= 0) {
    return { ok: false, error: 'Please reload the page and try again.', status: 400 };
  }
  const now = Date.now();
  const elapsed = now - t;
  if (elapsed < MIN_ELAPSED_MS) {
    return {
      ok: false,
      error: 'Please wait a moment before sending — then try again.',
      status: 429,
    };
  }
  if (elapsed > MAX_FORM_AGE_MS) {
    return {
      ok: false,
      error: 'This form session has expired. Please refresh the page and try again.',
      status: 400,
    };
  }
  return { ok: true };
}

export function countLinkLikeSegments(text: string): number {
  const m = text.match(/https?:\/\/[^\s]+|www\.[^\s]+/gi);
  return m ? m.length : 0;
}

export function messageLooksSpammy(message: string): boolean {
  const trimmed = message.trim();
  if (trimmed.length < 3) return true;
  if (countLinkLikeSegments(message) > MAX_LINKISH) return true;
  const unique = new Set(trimmed.toLowerCase().replace(/\s+/g, ''));
  if (trimmed.length > 40 && unique.size < 6) return true;
  return false;
}
