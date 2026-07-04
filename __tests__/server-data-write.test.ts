import { describe, expect, it, afterEach } from 'vitest';
import { canWriteProjectDataFiles, tryWriteProjectJson } from '@/lib/server-data-write';

describe('server-data-write', () => {
  const originalVercel = process.env.VERCEL;

  afterEach(() => {
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
  });

  it('skips writes on Vercel', () => {
    process.env.VERCEL = '1';
    expect(canWriteProjectDataFiles()).toBe(false);
    expect(tryWriteProjectJson('data/reports/test-skip.json', { ok: true })).toBe(false);
  });

  it('writes locally', () => {
    delete process.env.VERCEL;
    expect(canWriteProjectDataFiles()).toBe(true);
    expect(
      tryWriteProjectJson('data/reports/server-data-write-test.json', { probe: 1 }),
    ).toBe(true);
  });
});
