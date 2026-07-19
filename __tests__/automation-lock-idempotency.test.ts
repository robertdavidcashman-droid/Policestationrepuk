import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const store = new Map<string, unknown>();

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    get: async <T>(key: string) => (store.has(key) ? (store.get(key) as T) : null),
    set: async (key: string, value: unknown, opts?: { nx?: boolean; ex?: number }) => {
      if (opts?.nx && store.has(key)) return null;
      store.set(key, value);
      return 'OK';
    },
    del: async (key: string) => {
      store.delete(key);
      return 1;
    },
  }),
}));

import { acquireJobLock, releaseJobLock, clearExpiredJobLock } from '@/lib/automation/lock';
import {
  claimIdempotencyKey,
  bufferPostIdempotencyKey,
} from '@/lib/automation/idempotency';

describe('automation locks and idempotency', () => {
  beforeEach(() => {
    store.clear();
    vi.stubEnv('LOCK_TIMEOUT_MINUTES', '30');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prevents two healthcheck processes from both holding the lock', async () => {
    const a = await acquireJobLock('automation-daily-healthcheck', 'exec-a');
    const b = await acquireJobLock('automation-daily-healthcheck', 'exec-b');
    expect(a?.executionId).toBe('exec-a');
    expect(b).toBeNull();
  });

  it('does not allow one execution to release another lock', async () => {
    await acquireJobLock('automation-daily-healthcheck', 'exec-a');
    expect(await releaseJobLock('automation-daily-healthcheck', 'exec-b')).toBe(false);
    expect(await releaseJobLock('automation-daily-healthcheck', 'exec-a')).toBe(true);
  });

  it('clears expired locks for recovery', async () => {
    store.set('automation:lock:buffer-blog-posts', {
      jobName: 'buffer-blog-posts',
      executionId: 'old',
      acquiredAt: new Date(Date.now() - 3600_000).toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(await clearExpiredJobLock('buffer-blog-posts')).toBe(true);
    expect(store.has('automation:lock:buffer-blog-posts')).toBe(false);
  });

  it('does not clear active locks', async () => {
    await acquireJobLock('buffer-blog-posts', 'active');
    expect(await clearExpiredJobLock('buffer-blog-posts')).toBe(false);
  });

  it('claims idempotency keys once', async () => {
    const key = bufferPostIdempotencyKey({
      siteId: 'policestationrepuk',
      date: '2026-07-18',
      channelId: 'ch1',
      slug: 'hello',
      environment: 'production',
    });
    const first = await claimIdempotencyKey(key, 'post-1');
    const second = await claimIdempotencyKey(key, 'post-2');
    expect(first.claimed).toBe(true);
    expect(second.claimed).toBe(false);
    expect(second.existingValue).toBe('post-1');
  });
});
