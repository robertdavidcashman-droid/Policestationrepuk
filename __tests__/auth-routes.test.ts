import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/kv', () => ({
  getKV: () => null,
}));

vi.mock('@/lib/data', () => ({
  getRawReps: () => [],
  getRegisteredRepByEmail: async () => null,
}));

vi.mock('@/lib/admin-auth', () => ({
  isAdminEmail: () => false,
}));

vi.mock('@/lib/auth', () => ({
  verifyMagicCode: async () => ({ ok: false, error: 'Invalid code' }),
  createSession: async () => 'session-token',
  getSessionCookieName: () => 'repuk_session',
  destroySession: async () => {},
}));

vi.mock('@/lib/admin-password', () => ({
  isAdminPasswordConfigured: () => false,
  verifyAdminPassword: () => false,
}));

vi.mock('@/lib/contact-guards', () => ({
  getClientIp: () => '127.0.0.1',
  rateLimitOk: async () => ({ ok: true, remaining: 10 }),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => undefined,
  }),
}));

describe('auth routes (expanded)', () => {
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
  });

  it('verify-code rejects missing fields', async () => {
    const { POST } = await import('@/app/api/auth/verify-code/route');
    const res = await POST(
      new Request('http://localhost/api/auth/verify-code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@example.com' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('verify-code returns 401 for unknown email', async () => {
    const { POST } = await import('@/app/api/auth/verify-code/route');
    const res = await POST(
      new Request('http://localhost/api/auth/verify-code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@example.com', code: '123456' }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('admin-login returns 503 when password auth not configured', async () => {
    const { POST } = await import('@/app/api/auth/admin-login/route');
    const res = await POST(
      new Request('http://localhost/api/auth/admin-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'secret' }),
      }),
    );
    expect(res.status).toBe(503);
  });

  it('logout succeeds without an active session', async () => {
    const { POST } = await import('@/app/api/auth/logout/route');
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
