import { createHash } from 'node:crypto';
import { getKV } from '@/lib/kv';
import { logAutomationEvent } from './observability';

const IDEM_PREFIX = 'automation:idem:';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 45; // 45 days

export function buildIdempotencyKey(parts: Array<string | number | null | undefined>): string {
  const normalised = parts
    .map((p) => String(p ?? '').trim().toLowerCase())
    .filter(Boolean)
    .join('|');
  return createHash('sha256').update(normalised).digest('hex').slice(0, 40);
}

export interface IdempotencyClaim {
  key: string;
  claimed: boolean;
  existingValue: string | null;
}

/**
 * Atomic claim — returns claimed=true only for the first writer.
 * Subsequent callers get claimed=false with the existing value.
 */
export async function claimIdempotencyKey(
  key: string,
  value: string,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): Promise<IdempotencyClaim> {
  const kv = getKV();
  if (!kv) {
    // Fail-closed: without shared store, refuse to claim (caller should skip live side effects).
    return { key, claimed: false, existingValue: null };
  }

  const fullKey = `${IDEM_PREFIX}${key}`;
  const result = await kv.set(fullKey, value, { nx: true, ex: ttlSeconds });
  if (result === 'OK') {
    return { key, claimed: true, existingValue: null };
  }

  const existing = await kv.get<string>(fullKey);
  logAutomationEvent('automation.job.duplicate_prevented', {
    idempotencyKey: key,
    existingValue: existing ?? null,
  });
  return { key, claimed: false, existingValue: existing ?? null };
}

export async function getIdempotencyValue(key: string): Promise<string | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<string>(`${IDEM_PREFIX}${key}`)) ?? null;
}

export async function releaseIdempotencyKey(key: string): Promise<void> {
  const kv = getKV();
  if (!kv?.del) return;
  await kv.del(`${IDEM_PREFIX}${key}`);
}

/** Stable key for a Buffer social update attempt. */
export function bufferPostIdempotencyKey(input: {
  siteId: string;
  date: string;
  channelId: string;
  slug: string;
  environment?: string;
}): string {
  return buildIdempotencyKey([
    'buffer-post',
    input.environment ?? process.env.VERCEL_ENV ?? 'dev',
    input.siteId,
    input.date,
    input.channelId,
    input.slug,
  ]);
}

/** Stable key for a notification incident email. */
export function notificationIdempotencyKey(fingerprint: string, kind: string): string {
  return buildIdempotencyKey(['notification', kind, fingerprint]);
}
