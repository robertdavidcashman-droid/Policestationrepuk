import type { BufferKV } from './types';

const IDEM_PREFIX = 'buffer-engine:idem:';
const IDEM_TTL = 60 * 60 * 24 * 45;

export function bufferPostIdempotencyKey(input: {
  siteId: string;
  date: string;
  channelId: string;
  slug: string;
}): string {
  return `${input.siteId}|${input.date}|${input.channelId}|${input.slug}`;
}

/**
 * Claim a post-level idempotency key. Returns existing postId if already claimed.
 * Fail-open when KV is unavailable (scheduler day-lock still protects overlaps).
 */
export async function claimBufferPostIdempotency(
  kv: BufferKV | null | undefined,
  key: string,
  value: string,
): Promise<{ claimed: boolean; existingPostId: string | null }> {
  if (!kv) return { claimed: true, existingPostId: null };
  const fullKey = `${IDEM_PREFIX}${key}`;
  const result = await kv.set(fullKey, value, { nx: true, ex: IDEM_TTL });
  if (result === 'OK') {
    return { claimed: true, existingPostId: null };
  }
  const existing = await kv.get<string>(fullKey);
  return { claimed: false, existingPostId: existing ?? null };
}

export async function finalizeBufferPostIdempotency(
  kv: BufferKV | null | undefined,
  key: string,
  postId: string,
): Promise<void> {
  if (!kv) return;
  await kv.set(`${IDEM_PREFIX}${key}`, postId, { ex: IDEM_TTL });
}
