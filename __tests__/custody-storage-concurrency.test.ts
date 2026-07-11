import { beforeEach, describe, expect, it, vi } from 'vitest';

const sets = vi.hoisted(() => new Map<string, Set<string>>());

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    smembers: async (key: string) => [...(sets.get(key) ?? [])],
    sadd: async (key: string, id: string) => {
      const bucket = sets.get(key) ?? new Set<string>();
      bucket.add(id);
      sets.set(key, bucket);
      return 1;
    },
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    pipeline: () => ({
      sadd: () => {},
      exec: async () => [],
    }),
  }),
  skipKVInPrerender: () => false,
}));

import { addToIndexSet } from '@/lib/kv-atomic';

describe('custody index concurrency', () => {
  beforeEach(() => {
    sets.clear();
  });

  it('addToIndexSet retains all unique ids under concurrent writes', async () => {
    const key = 'custodyfinding:suite:test-suite';
    await Promise.all(
      Array.from({ length: 30 }, (_, i) => addToIndexSet(key, `finding_${i}`)),
    );
    const ids = [...(sets.get(key) ?? [])];
    expect(ids.length).toBe(30);
    expect(new Set(ids).size).toBe(30);
  });
});
