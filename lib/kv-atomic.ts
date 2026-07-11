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

/** Read string index — Redis SET (SMEMBERS) with legacy JSON array fallback. */
export async function readIndexMembers(key: string): Promise<string[]> {
  const kv = getKV();
  if (!kv) return [];

  try {
    const members = await kv.smembers(key);
    if (Array.isArray(members) && members.length > 0) {
      return members.map(String);
    }
  } catch {
    // Key may be legacy JSON array type — fall through.
  }

  const raw = await kv.get<string[]>(key);
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const pipeline = kv.pipeline();
  for (const id of raw) pipeline.sadd(key, id);
  await pipeline.exec();
  return raw;
}

/** Atomically add a unique id to a string index (Redis SADD). */
export async function addToIndexSet(key: string, id: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.sadd(key, id);
}

/** @deprecated Use addToIndexSet — kept for callers migrating from RMW append. */
export async function appendUniqueToIndex(
  key: string,
  id: string,
): Promise<void> {
  await addToIndexSet(key, id);
}
