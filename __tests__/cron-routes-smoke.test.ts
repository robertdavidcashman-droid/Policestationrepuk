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

  it('buffer-blog-posts returns buffer_env_invalid when channels missing in production', async () => {
    const prevVitest = process.env.VITEST;
    delete process.env.VITEST;
    process.env.NODE_ENV = 'production';
    process.env.CRON_SECRET = 'test-secret';
    process.env.BUFFER_API_KEY = 'buf-key';
    delete process.env.BUFFER_CHANNEL_TWITTER_ID;
    delete process.env.BUFFER_CHANNEL_LINKEDIN_ID;
    delete process.env.BUFFER_CHANNEL_GOOGLEBUSINESS_ID;
    vi.resetModules();
    const { GET } = await import('@/app/api/cron/buffer-blog-posts/route');
    const res = await GET(
      new Request('http://localhost/api/cron/buffer-blog-posts', {
        headers: { authorization: 'Bearer test-secret' },
      }),
    );
    process.env.VITEST = prevVitest;
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('buffer_env_invalid');
    expect(json.errors).toBeInstanceOf(Array);
  });

  it('custody-number-discovery returns custody_env_invalid when Serper missing in production', async () => {
    const prevVitest = process.env.VITEST;
    delete process.env.VITEST;
    process.env.NODE_ENV = 'production';
    process.env.CRON_SECRET = 'test-secret';
    delete process.env.SERPER_API_KEY;
    vi.resetModules();
    const { GET } = await import('@/app/api/cron/custody-number-discovery/route');
    const res = await GET(
      new Request('http://localhost/api/cron/custody-number-discovery', {
        headers: { authorization: 'Bearer test-secret' },
      }),
    );
    process.env.VITEST = prevVitest;
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('custody_env_invalid');
  });
});
