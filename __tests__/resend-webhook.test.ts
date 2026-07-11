import { describe, expect, it } from 'vitest';

describe('resend webhook', () => {
  it('rejects requests without a valid signature in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.RESEND_WEBHOOK_SECRET = 'whsec_test';
    const { POST } = await import('@/app/api/webhooks/resend/route');
    const res = await POST(
      new Request('http://localhost/api/webhooks/resend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'email.sent', data: { to: 'a@b.com' } }),
      }),
    );
    expect(res.status).toBe(401);
  });
});
