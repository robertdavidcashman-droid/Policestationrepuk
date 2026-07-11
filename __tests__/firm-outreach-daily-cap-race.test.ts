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
    expire: async () => 'OK',
    get: async (key: string) => store.get(key) ?? null,
  }),
  skipKVInPrerender: () => false,
}));

import { incrementDailySendCount } from '@/lib/firm-outreach/storage';

describe('incrementDailySendCount race', () => {
  beforeEach(() => {
    store.clear();
  });

  it('increments atomically under concurrent calls', async () => {
    const date = '2026-07-09';
    const campaignId = 'repuk_whatsapp_v1';
    const results = await Promise.all(
      Array.from({ length: 20 }, () => incrementDailySendCount(date, campaignId)),
    );

    expect(Math.max(...results)).toBe(20);
    expect(store.get(`firmoutreach:daily:${campaignId}:${date}`)).toBe(20);
  });
});
