import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import sharp from 'sharp';
import type { BufferEngineAdapter, BufferKV, SchedulablePost } from './types';
import { runSiteBufferScheduler } from './scheduler';
import { verifySiteBufferSchedule } from './verify';
import { runSiteBufferSelfTest } from './selftest';

function makeKV(): BufferKV {
  const store = new Map<string, unknown>();
  return {
    get: async <T>(key: string) => (store.has(key) ? (store.get(key) as T) : null),
    set: async (key, value) => {
      store.set(key, value);
      return 'OK';
    },
    del: async (key) => {
      store.delete(key);
      return 1;
    },
  };
}

function makePosts(n: number): SchedulablePost[] {
  return Array.from({ length: n }, (_, i) => ({
    feedId: 'testsite',
    slug: `post-${i}`,
    title: `Post ${i}`,
    excerpt: `Excerpt ${i}`,
    url: `https://testsite.com/blog/post-${i}`,
    imageUrl: `https://testsite.com/images/post-${i}.jpg`,
    imageAlt: `Post ${i}`,
  }));
}

let jpegBytes: Buffer;
let createdPosts: Array<{ dueAt: string; channelId: string; text: string }>;

function installFetchMock() {
  createdPosts = [];
  const mock = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init?.method ?? 'GET').toUpperCase();

    if (url.startsWith('https://api.buffer.com')) {
      const body = JSON.parse((init?.body as string) ?? '{}');
      if (/createPost/.test(body.query)) {
        const v = body.variables.input;
        createdPosts.push({ dueAt: v.dueAt, channelId: v.channelId, text: v.text });
        return Response.json({
          data: {
            createPost: {
              __typename: 'PostActionSuccess',
              post: {
                id: `id-${createdPosts.length}`,
                dueAt: v.dueAt,
                channelId: v.channelId,
                channelService: 'twitter',
              },
            },
          },
        });
      }
      return Response.json({ data: { posts: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } } });
    }

    // Image probes
    const headers = new Headers({
      'content-type': 'image/jpeg',
      'content-length': String(jpegBytes.length),
    });
    if (method === 'HEAD') return new Response(null, { status: 200, headers });
    return new Response(jpegBytes, { status: 200, headers });
  }) as unknown as typeof fetch;

  vi.stubGlobal('fetch', mock);
}

const BASE_ENV = { ...process.env };

beforeEach(async () => {
  jpegBytes = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#123456' } })
    .jpeg()
    .toBuffer();
  process.env = {
    ...BASE_ENV,
    BUFFER_API_KEY: 'test-key',
    BUFFER_ORGANIZATION_ID: 'a'.repeat(24),
    BUFFER_CHANNEL_TWITTER_ID: 'b'.repeat(24),
    BUFFER_CHANNEL_LINKEDIN_ID: 'c'.repeat(24),
    BUFFER_SCHEDULER_POSTS_PER_FEED: '5',
  };
  installFetchMock();
});

afterEach(() => {
  process.env = { ...BASE_ENV };
  vi.unstubAllGlobals();
});

function makeAdapter(kv: BufferKV, posts: SchedulablePost[]): BufferEngineAdapter {
  return {
    siteId: 'testsite',
    siteUrl: 'https://testsite.com',
    kv,
    getSchedulablePosts: () => posts,
  };
}

describe('runSiteBufferScheduler', () => {
  it('schedules at least 5 posts with no repeated slug', async () => {
    const kv = makeKV();
    const adapter = makeAdapter(kv, makePosts(20));
    const result = await runSiteBufferScheduler(adapter, { now: new Date('2026-06-28T05:00:00Z') });

    expect(result.ok).toBe(true);
    expect(result.posts?.length).toBeGreaterThanOrEqual(5);
    const slugs = result.posts!.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('is idempotent for the same date (skips re-run)', async () => {
    const kv = makeKV();
    const adapter = makeAdapter(kv, makePosts(20));
    const now = new Date('2026-06-28T05:00:00Z');
    await runSiteBufferScheduler(adapter, { now });
    const second = await runSiteBufferScheduler(adapter, { now });
    expect(second.skipped).toBe(true);
  });

  it('does not reuse slugs scheduled within the cooldown window', async () => {
    const kv = makeKV();
    const adapter = makeAdapter(kv, makePosts(20));
    const day1 = await runSiteBufferScheduler(adapter, { now: new Date('2026-06-28T05:00:00Z') });
    const day2 = await runSiteBufferScheduler(adapter, { now: new Date('2026-06-29T05:00:00Z') });
    const slugs1 = new Set(day1.posts!.map((p) => p.slug));
    const slugs2 = new Set(day2.posts!.map((p) => p.slug));
    const overlap = [...slugs2].filter((s) => slugs1.has(s));
    expect(overlap).toHaveLength(0);
  });

  it('dry-run does not call createPost', async () => {
    const kv = makeKV();
    const adapter = makeAdapter(kv, makePosts(20));
    const result = await runSiteBufferScheduler(adapter, {
      now: new Date('2026-06-28T05:00:00Z'),
      dryRun: true,
    });
    expect(result.dryRun).toBe(true);
    expect(createdPosts).toHaveLength(0);
    expect(result.posts?.length).toBeGreaterThanOrEqual(5);
  });
});

describe('verifySiteBufferSchedule', () => {
  it('flags under-quota and gap-fills', async () => {
    const kv = makeKV();
    const adapter = makeAdapter(kv, makePosts(20));
    const result = await verifySiteBufferSchedule(adapter, {
      now: new Date('2026-06-28T05:00:00Z'),
      gapFill: true,
    });
    expect(result.requiredCount).toBe(5);
    expect(result.scheduledCount).toBeGreaterThanOrEqual(5);
  });
});

describe('runSiteBufferSelfTest', () => {
  it('runs without throwing and reports required count', async () => {
    const kv = makeKV();
    const adapter = makeAdapter(kv, makePosts(20));
    const result = await runSiteBufferSelfTest(adapter, { now: new Date('2026-06-28T05:00:00Z') });
    expect(result.requiredCount).toBe(5);
    expect(result.date).toBe('2026-06-27');
  });
});
