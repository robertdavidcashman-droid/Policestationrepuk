import { beforeEach, describe, expect, it, vi } from 'vitest';

const claimResults = vi.hoisted(() => ({ first: true, second: false }));

vi.mock('@/lib/kv', () => ({
  getKV: () => ({
    set: async (_key: string, _value: unknown, opts?: { nx?: boolean }) => {
      if (opts?.nx) {
        const ok = claimResults.first;
        claimResults.first = false;
        return ok ? 'OK' : null;
      }
      return 'OK';
    },
  }),
}));

import { claimKey } from '@/lib/kv-atomic';

describe('cron overlap locks', () => {
  beforeEach(() => {
    claimResults.first = true;
    claimResults.second = false;
  });

  it('claimKey allows only one concurrent holder', async () => {
    const key = 'buffer-engine:lock:policestationrepuk:2026-07-11';
    const first = await claimKey(key, 7200);
    const second = await claimKey(key, 7200);
    expect(first).toBe(true);
    expect(second).toBe(false);
  });
});
