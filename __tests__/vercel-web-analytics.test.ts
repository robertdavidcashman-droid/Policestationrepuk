import { describe, expect, it, afterEach } from 'vitest';
import { vercelWebAnalyticsEnabled } from '@/lib/vercel-web-analytics';

describe('vercelWebAnalyticsEnabled', () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it('is disabled for local next start', () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'development';
    expect(vercelWebAnalyticsEnabled()).toBe(false);
  });

  it('is enabled only on Vercel production', () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';
    expect(vercelWebAnalyticsEnabled()).toBe(true);
  });

  it('is disabled when VERCEL is unset', () => {
    delete process.env.VERCEL;
    process.env.VERCEL_ENV = 'production';
    expect(vercelWebAnalyticsEnabled()).toBe(false);
  });
});
