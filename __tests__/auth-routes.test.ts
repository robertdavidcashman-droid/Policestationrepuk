import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/kv', () => ({
  getKV: () => null,
}));

vi.mock('@/lib/contact-guards', () => ({
  getClientIp: () => '127.0.0.1',
  rateLimitOk: async () => ({ ok: true }),
}));

describe('auth routes', () => {
  it('send-code returns 503 when KV is not configured', async () => {
    const { POST } = await import('@/app/api/auth/send-code/route');
    const res = await POST(
      new Request('http://localhost/api/auth/send-code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      }),
    );
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain('not configured');
  });
});
