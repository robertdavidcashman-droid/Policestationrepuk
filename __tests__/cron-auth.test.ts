import { describe, expect, it, vi, afterEach } from 'vitest';
import { isCronAuthorized, isOutreachBootstrapAuthorized } from '@/lib/cron-auth';

describe('isCronAuthorized', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows any request when secret is unset in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const req = new Request('http://localhost/api/cron/test');
    expect(isCronAuthorized(req, '')).toBe(true);
  });

  it('rejects when secret is unset in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const req = new Request('http://localhost/api/cron/test');
    expect(isCronAuthorized(req, '')).toBe(false);
  });

  it('rejects missing credentials when secret is set', () => {
    const req = new Request('http://localhost/api/cron/test');
    expect(isCronAuthorized(req, 'secret')).toBe(false);
  });

  it('accepts Bearer token', () => {
    const req = new Request('http://localhost/api/cron/test', {
      headers: { authorization: 'Bearer secret' },
    });
    expect(isCronAuthorized(req, 'secret')).toBe(true);
  });

  it('accepts x-cron-secret header', () => {
    const req = new Request('http://localhost/api/cron/test', {
      headers: { 'x-cron-secret': 'secret' },
    });
    expect(isCronAuthorized(req, 'secret')).toBe(true);
  });
});

describe('isOutreachBootstrapAuthorized', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts cron Bearer auth', () => {
    vi.stubEnv('CRON_SECRET', 'cron');
    vi.stubEnv('FIRM_OUTREACH_BOOTSTRAP_SECRET', 'boot');
    const req = new Request('http://localhost/api/cron/test', {
      headers: { authorization: 'Bearer cron' },
    });
    expect(isOutreachBootstrapAuthorized(req)).toBe(true);
  });

  it('accepts bootstrap header when cron is wrong', () => {
    vi.stubEnv('CRON_SECRET', 'cron');
    vi.stubEnv('FIRM_OUTREACH_BOOTSTRAP_SECRET', 'boot');
    const req = new Request('http://localhost/api/cron/test', {
      headers: { 'x-firm-outreach-bootstrap-secret': 'boot' },
    });
    expect(isOutreachBootstrapAuthorized(req)).toBe(true);
  });

  it('rejects when neither secret matches', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'cron');
    vi.stubEnv('FIRM_OUTREACH_BOOTSTRAP_SECRET', 'boot');
    const req = new Request('http://localhost/api/cron/test');
    expect(isOutreachBootstrapAuthorized(req)).toBe(false);
  });
});
