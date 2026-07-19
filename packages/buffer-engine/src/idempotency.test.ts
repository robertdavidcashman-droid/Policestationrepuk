import { describe, expect, it } from 'vitest';
import {
  bufferPostIdempotencyKey,
  claimBufferPostIdempotency,
  finalizeBufferPostIdempotency,
} from './idempotency';
import type { BufferKV } from './types';

function memoryKv(): BufferKV & { store: Map<string, unknown> } {
  const store = new Map<string, unknown>();
  return {
    store,
    get: async <T>(key: string) => (store.has(key) ? (store.get(key) as T) : null),
    set: async (key, value, options) => {
      if (options?.nx && store.has(key)) return null;
      store.set(key, value);
      return 'OK';
    },
    del: async (key) => {
      store.delete(key);
      return 1;
    },
  };
}

describe('buffer-engine idempotency', () => {
  it('prevents duplicate Buffer submission claims', async () => {
    const kv = memoryKv();
    const key = bufferPostIdempotencyKey({
      siteId: 'policestationrepuk',
      date: '2026-07-18',
      channelId: 'tw',
      slug: 'article',
    });
    const first = await claimBufferPostIdempotency(kv, key, 'pending');
    expect(first.claimed).toBe(true);
    await finalizeBufferPostIdempotency(kv, key, 'post-123');
    const second = await claimBufferPostIdempotency(kv, key, 'pending');
    expect(second.claimed).toBe(false);
    expect(second.existingPostId).toBe('post-123');
  });
});
