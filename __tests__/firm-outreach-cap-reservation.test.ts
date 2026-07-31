import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => new Map<string, number>());

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    set: async (key: string, value: unknown, opts?: { nx?: boolean }) => {
      if (opts?.nx && store.has(key)) return null;
      store.set(key, typeof value === 'number' ? value : 1);
      return 'OK';
    },
    incr: async (key: string) => {
      const next = (store.get(key) ?? 0) + 1;
      store.set(key, next);
      return next;
    },
    decr: async (key: string) => {
      const next = (store.get(key) ?? 0) - 1;
      store.set(key, next);
      return next;
    },
    expire: async () => 'OK',
    get: async (key: string) => store.get(key) ?? null,
  }),
  skipKVInPrerender: () => false,
}));

import {
  getDailySendCount,
  releaseDailySendSlot,
  reserveDailySendSlot,
  reserveHourlySendSlot,
} from '@/lib/firm-outreach/storage';

describe('daily/hourly cap reservation', () => {
  beforeEach(() => {
    store.clear();
  });

  it('reserves up to the daily cap and rejects the overflow under concurrency', async () => {
    const date = '2026-07-31';
    const campaignId = 'whatsapp_invite_v1';
    const cap = 5;

    const results = await Promise.all(
      Array.from({ length: 20 }, () => reserveDailySendSlot(date, campaignId, cap)),
    );

    const ok = results.filter((r) => r.ok);
    const denied = results.filter((r) => !r.ok);
    expect(ok).toHaveLength(5);
    expect(denied).toHaveLength(15);
    expect(await getDailySendCount(date, campaignId)).toBe(5);
  });

  it('releases a reserved slot after provider failure', async () => {
    const date = '2026-07-31';
    const campaignId = 'agent_cover_kent_v1';
    const reserved = await reserveDailySendSlot(date, campaignId, 10);
    expect(reserved.ok).toBe(true);
    await releaseDailySendSlot(date, campaignId);
    expect(await getDailySendCount(date, campaignId)).toBe(0);
  });

  it('enforces hourly cap when configured', async () => {
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        reserveHourlySendSlot('whatsapp_invite_v1', '2026-07-31T12', 3),
      ),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(3);
    expect(results.filter((r) => !r.ok)).toHaveLength(3);
  });
});
