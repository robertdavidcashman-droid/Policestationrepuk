import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/buffer/engine-run', () => ({
  runRepukBufferSelfTest: vi.fn(async () => ({
    ok: true,
    date: '2026-01-15',
    sentCount: 5,
    requiredCount: 5,
    metricsIngested: 2,
    issues: [],
  })),
}));

vi.mock('@/lib/cron-auth', () => ({
  isCronAuthorized: vi.fn((req: Request) => {
    const secret = req.headers.get('x-cron-secret');
    return secret === 'test-secret';
  }),
}));

describe('buffer-selftest cron route', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns 401 without cron auth', async () => {
    const { GET } = await import('@/app/api/cron/buffer-selftest/route');
    const res = await GET(new Request('http://localhost/api/cron/buffer-selftest'));
    expect(res.status).toBe(401);
  });

  it('returns selftest result when authorized', async () => {
    const { GET } = await import('@/app/api/cron/buffer-selftest/route');
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-selftest', {
        headers: { 'x-cron-secret': 'test-secret' },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.sentCount).toBe(5);
  });
});
