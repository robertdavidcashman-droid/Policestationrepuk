import { beforeEach, describe, expect, it, vi } from 'vitest';

const lists = vi.hoisted(() => new Map<string, string[]>());

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    get: async (key: string) => lists.get(key) ?? null,
    set: async (key: string, value: string[]) => {
      lists.set(key, value);
    },
    del: async (key: string) => {
      lists.delete(key);
    },
  }),
  skipKVInPrerender: () => false,
}));

import { appendUniqueToIndex } from '@/lib/kv-atomic';

describe('custody index concurrency', () => {
  beforeEach(() => {
    lists.clear();
  });

  it('appendUniqueToIndex retains all unique ids under concurrent writes', async () => {
    const key = 'custodyfinding:suite:test-suite';
    await Promise.all(
      Array.from({ length: 30 }, (_, i) => appendUniqueToIndex(key, `finding_${i}`)),
    );
    const ids = lists.get(key) ?? [];
    expect(ids.length).toBe(30);
    expect(new Set(ids).size).toBe(30);
  });
});
