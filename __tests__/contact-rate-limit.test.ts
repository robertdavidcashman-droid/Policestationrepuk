import { describe, expect, it, vi, beforeEach } from 'vitest';

const buckets = new Map<string, number[]>();

vi.mock('@/lib/kv', () => ({
  getKV: () => null,
}));

vi.mock('@/lib/contact-guards', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/contact-guards')>();
  return {
    ...actual,
    getClientIp: () => '203.0.113.9',
  };
});

vi.mock('@/lib/email', () => ({
  sendContactNotification: vi.fn(async () => true),
}));

vi.mock('@/lib/submissions', () => ({
  saveSubmission: vi.fn(async () => 'sub-1'),
}));

describe('contact route KV rate limiting', () => {
  beforeEach(() => {
    vi.resetModules();
    buckets.clear();
  });

  it('returns 429 after exceeding in-memory contact limit', async () => {
    const { POST } = await import('@/app/api/contact/route');
    const body = {
      name: 'Test User',
      email: 'test@example.com',
      message: 'Hello from rate limit test',
      _startedAt: Date.now() - 5000,
    };

    for (let i = 0; i < 5; i++) {
      const res = await POST(
        new Request('http://localhost/api/contact', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }),
      );
      expect(res.status).toBeLessThan(429);
    }

    const blocked = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    );
    expect(blocked.status).toBe(429);
  });
});
