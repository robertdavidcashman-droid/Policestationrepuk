import { describe, expect, it } from 'vitest';

describe('health and ready endpoints', () => {
  it('health returns ok without secrets', async () => {
    const { GET } = await import('@/app/api/health/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe('policestationrepuk');
  });

  it('ready reports check flags without exposing secrets', async () => {
    const { GET } = await import('@/app/api/ready/route');
    const res = await GET();
    const body = await res.json();
    expect(body.checks).toBeDefined();
    expect(body.checks.cronSecretConfigured).toBeTypeOf('boolean');
    expect(body.checks.resendConfigured).toBeTypeOf('boolean');
    expect(Object.keys(body)).not.toContain('CRON_SECRET');
  });
});
