import { afterEach, describe, expect, it } from 'vitest';

const ENV = process.env;

describe('cron route auth smoke', () => {
  afterEach(() => {
    process.env = { ...ENV };
  });

  it('indexnow returns 401 without cron secret in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CRON_SECRET = 'test-secret';
    const { GET } = await import('@/app/api/cron/indexnow/route');
    const res = await GET(new Request('http://localhost/api/cron/indexnow'));
    expect(res.status).toBe(401);
  });

  it('indexnow returns 200 with valid bearer in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CRON_SECRET = 'test-secret';
    const { GET } = await import('@/app/api/cron/indexnow/route');
    const res = await GET(
      new Request('http://localhost/api/cron/indexnow', {
        headers: { authorization: 'Bearer test-secret' },
      }),
    );
    expect(res.status).not.toBe(401);
  });

  it('buffer-blog-posts returns 401 without cron secret in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CRON_SECRET = 'test-secret';
    const { GET } = await import('@/app/api/cron/buffer-blog-posts/route');
    const res = await GET(new Request('http://localhost/api/cron/buffer-blog-posts'));
    expect(res.status).toBe(401);
  });

  it('custody-number-discovery returns 401 without cron secret in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CRON_SECRET = 'test-secret';
    const { GET } = await import('@/app/api/cron/custody-number-discovery/route');
    const res = await GET(new Request('http://localhost/api/cron/custody-number-discovery'));
    expect(res.status).toBe(401);
  });
});
