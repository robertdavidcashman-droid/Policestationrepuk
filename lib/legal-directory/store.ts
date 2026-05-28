/**
 * Storage abstraction for the Legal Services Directory.
 *
 * Uses Upstash KV when configured (production). When KV is not configured
 * (local dev / preview without env vars) it falls back to an in-process Map so
 * the directory remains fully testable. This mirrors the in-memory fallback
 * pattern already used by lib/contact-guards.ts for rate limiting.
 *
 * IMPORTANT: the in-memory fallback is per-process and NOT durable. Production
 * MUST configure UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN) so
 * listings persist across serverless instances and deploys.
 */

import { getKV, skipKVInPrerender } from '@/lib/kv';

export interface DirectoryStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  del(key: string): Promise<void>;
  /** True when backed by durable KV; false for the in-memory dev fallback. */
  durable: boolean;
}

/**
 * Back the fallback Map with a globalThis singleton so all route-handler module
 * instances within one Node process share the same store. Next.js dev can
 * evaluate a module more than once across route segments; without the global
 * singleton each route would get an isolated Map and cross-route flows (submit
 * then manage) would not see each other's data.
 */
const globalForStore = globalThis as unknown as {
  __legalDirectoryMemory?: Map<string, string>;
  __legalDirectoryWarned?: boolean;
};
const memory: Map<string, string> =
  globalForStore.__legalDirectoryMemory ?? (globalForStore.__legalDirectoryMemory = new Map());

function memoryStore(): DirectoryStore {
  if (!globalForStore.__legalDirectoryWarned && process.env.NODE_ENV !== 'production') {
    console.warn(
      '[legal-directory] KV not configured — using in-memory store (data is NOT persisted). ' +
        'Set UPSTASH_REDIS_REST_URL/TOKEN for durable storage.',
    );
    globalForStore.__legalDirectoryWarned = true;
  }
  return {
    durable: false,
    async get<T>(key: string): Promise<T | null> {
      const raw = memory.get(key);
      return raw === undefined ? null : (JSON.parse(raw) as T);
    },
    async set<T>(key: string, value: T): Promise<void> {
      memory.set(key, JSON.stringify(value));
    },
    async del(key: string): Promise<void> {
      memory.delete(key);
    },
  };
}

function kvStore(kv: NonNullable<ReturnType<typeof getKV>>): DirectoryStore {
  return {
    durable: true,
    async get<T>(key: string): Promise<T | null> {
      const v = await kv.get<T>(key);
      return v ?? null;
    },
    async set<T>(key: string, value: T): Promise<void> {
      await kv.set(key, value);
    },
    async del(key: string): Promise<void> {
      await kv.del(key);
    },
  };
}

/** Returns the active store, or null during static prerender (build) to avoid noise. */
export function getDirectoryStore(): DirectoryStore | null {
  if (skipKVInPrerender()) return null;
  const kv = getKV();
  if (kv) return kvStore(kv);
  return memoryStore();
}
