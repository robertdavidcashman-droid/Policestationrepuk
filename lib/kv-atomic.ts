import { getKV } from '@/lib/kv';

/** Atomic SET NX — returns true when this caller claimed the key. */
export async function claimKey(
  key: string,
  ttlSeconds: number,
  value = new Date().toISOString(),
): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  const result = await kv.set(key, value, { nx: true, ex: ttlSeconds });
  return result === 'OK';
}

/** Increment a counter with TTL refresh (uses Redis INCR when available). */
export async function incrementCounter(
  key: string,
  ttlSeconds: number,
): Promise<number> {
  const kv = getKV();
  if (!kv) return 0;
  const next = await kv.incr(key);
  if (next === 1) {
    await kv.expire(key, ttlSeconds);
  }
  return next;
}

/** Append a unique id to a string list index (read-modify-write with retry). */
export async function appendUniqueToIndex(
  key: string,
  id: string,
  maxRetries = 3,
): Promise<void> {
  const kv = getKV();
  if (!kv) return;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const raw = await kv.get<string[]>(key);
    const ids = Array.isArray(raw) ? [...raw] : [];
    if (ids.includes(id)) return;
    ids.push(id);
    await kv.set(key, ids);
    const verify = await kv.get<string[]>(key);
    if (Array.isArray(verify) && verify.includes(id)) return;
  }
}
