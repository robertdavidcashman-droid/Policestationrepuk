import { describe, expect, it, afterEach } from 'vitest';
import { vercelWebAnalyticsEnabled } from '@/lib/vercel-web-analytics';

describe('vercelWebAnalyticsEnabled', () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it('is disabled for local next start', () => {
    delete process.env.NEXT_PUBLIC_VERCEL_ENV;
    expect(vercelWebAnalyticsEnabled()).toBe(false);
  });

  it('is enabled only on Vercel production', () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = 'production';
    expect(vercelWebAnalyticsEnabled()).toBe(true);
  });

  it('is disabled during audit isolation', () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = 'production';
    process.env.DISABLE_KV_FOR_AUDIT = '1';
    expect(vercelWebAnalyticsEnabled()).toBe(false);
  });
});
