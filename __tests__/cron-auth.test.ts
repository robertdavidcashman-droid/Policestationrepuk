import { describe, expect, it } from 'vitest';
import { isCronAuthorized } from '@/lib/cron-auth';

describe('isCronAuthorized', () => {
  it('allows any request when secret is unset', () => {
    const req = new Request('http://localhost/api/cron/test');
    // Explicit empty string — `undefined` would fall through to process.env.CRON_SECRET via default param.
    expect(isCronAuthorized(req, '')).toBe(true);
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
