import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveSchedulerRun as saveEngineSchedulerRun } from '@robertcashman/buffer-engine';
import type { SchedulerRunRecord } from '@robertcashman/buffer-engine';
import { BUFFER_SCHEDULER_SITE_ID } from '@/lib/buffer/scheduler-storage';

const store = new Map<string, unknown>();

const fakeKv = {
  get: async <T>(key: string) => (store.get(key) as T | undefined) ?? null,
  set: async (key: string, value: unknown) => {
    store.set(key, value);
  },
  del: async (key: string) => {
    store.delete(key);
  },
};

vi.mock('@/lib/kv', () => ({
  getKV: () => fakeKv,
  skipKVInPrerender: () => false,
}));

const sampleRun: SchedulerRunRecord = {
  date: '2026-06-30',
  scheduledAt: '2026-06-30T05:05:00.000Z',
  postIds: ['post-a', 'post-b'],
  slugs: ['slug-a', 'slug-b'],
  feedIds: ['policestationrepuk', 'custodynote'],
  channels: ['ch1', 'ch2'],
  dueAts: ['2026-06-30T08:00:00.000Z', '2026-06-30T12:00:00.000Z'],
};

describe('buffer scheduler storage key alignment', () => {
  beforeEach(() => {
    store.clear();
    vi.resetModules();
  });

  it('reads engine-written run records via lib getSchedulerRunForDate', async () => {
    await saveEngineSchedulerRun(fakeKv, BUFFER_SCHEDULER_SITE_ID, sampleRun);

    const expectedKey = `buffer-engine:run:${BUFFER_SCHEDULER_SITE_ID}:${sampleRun.date}`;
    expect(store.has(expectedKey)).toBe(true);

    const { getSchedulerRunForDate } = await import('@/lib/buffer/scheduler-storage');
    const run = await getSchedulerRunForDate(sampleRun.date);

    expect(run).toEqual(sampleRun);
  });

  it('writes run records to the engine key via lib saveSchedulerRun', async () => {
    const { saveSchedulerRun, getSchedulerRunForDate } = await import(
      '@/lib/buffer/scheduler-storage'
    );

    await saveSchedulerRun(sampleRun);

    const expectedKey = `buffer-engine:run:${BUFFER_SCHEDULER_SITE_ID}:${sampleRun.date}`;
    expect(store.get(expectedKey)).toEqual(sampleRun);

    const run = await getSchedulerRunForDate(sampleRun.date);
    expect(run).toEqual(sampleRun);
  });

  it('uses engine recent-slugs key for cooldown entries', async () => {
    const entries = [{ slug: 'test-slug', feedId: 'policestationrepuk', scheduledAt: '2026-06-30T05:05:00.000Z' }];
    const expectedKey = `buffer-engine:recent-slugs:${BUFFER_SCHEDULER_SITE_ID}`;

    const { saveRecentSlugEntries, getRecentSlugEntries } = await import(
      '@/lib/buffer/scheduler-storage'
    );

    await saveRecentSlugEntries(entries);

    expect(store.get(expectedKey)).toEqual(entries);
    await expect(getRecentSlugEntries()).resolves.toEqual(entries);
  });
});
