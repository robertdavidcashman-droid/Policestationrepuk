import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildBufferImageAssets, resolveAbsoluteImageUrl } from '@/lib/buffer/assets';
import {
  FEED_DEFAULT_IMAGES,
  getContentFeeds,
  hydratePostImagesForBuffer,
  loadFeedPosts,
  validateContentFeeds,
} from '@/lib/buffer/feeds';
import { SITE_URL } from '@/lib/seo-layer/config';

describe('buffer feed loaders', () => {
  it('local posts include absolute imageUrl from blog registry', async () => {
    const posts = await loadFeedPosts({ id: 'policestationrepuk', type: 'local' });
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      expect(post.imageUrl).toMatch(/^https?:\/\//);
      expect(post.imageUrl).toContain('/images/blog/');
      expect(post.imageAlt).toBeTruthy();
    }
  });

  it('rss posts pass through parsed imageUrl', async () => {
    const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <item>
    <title>With image</title>
    <link>https://example.com/blog/post-a</link>
    <description>Excerpt</description>
    <enclosure url="https://example.com/img.jpg" type="image/jpeg" length="50000" />
  </item>
</rss>`;

    const posts = await loadFeedPosts(
      { id: 'custodynote', type: 'rss', url: 'https://example.com/feed' },
      async () => xml,
    );

    expect(posts[0]?.imageUrl).toBe('https://example.com/img.jpg');
    expect(posts[0]?.imageAlt).toBe('With image');
  });

  it('loadFeedPosts applies psrtrain hosted GBP default image', async () => {
    const xml = `<?xml version="1.0"?><rss><channel><item>
      <title>Guide</title>
      <link>https://psrtrain.com/guides/what-is-psras</link>
      <description>Excerpt</description>
    </item></channel></rss>`;
    const posts = await loadFeedPosts(
      { id: 'psrtrain', type: 'rss', url: 'https://psrtrain.com/feed' },
      async () => xml,
    );
    expect(posts[0]?.imageUrl).toBe(FEED_DEFAULT_IMAGES.psrtrain);
    expect(posts[0]?.imageUrl).toContain('/images/buffer/gbp/psrtrain-default.jpg');
  });

  it('resolveAbsoluteImageUrl prefixes relative paths', () => {
    const base = SITE_URL.replace(/\/$/, '');
    expect(resolveAbsoluteImageUrl(base, '/images/foo.webp')).toBe(`${base}/images/foo.webp`);
    expect(resolveAbsoluteImageUrl(base, 'https://cdn.example/x.png')).toBe('https://cdn.example/x.png');
  });

  it('buildBufferImageAssets returns empty array without imageUrl', () => {
    expect(buildBufferImageAssets({ title: 'Test' })).toEqual([]);
  });

  it('buildBufferImageAssets returns Buffer GraphQL shape', () => {
    expect(
      buildBufferImageAssets({
        imageUrl: 'https://example.com/a.png',
        imageAlt: 'Alt text',
        title: 'Title',
      }),
    ).toEqual([
      {
        image: {
          url: 'https://example.com/a.png',
          metadata: { altText: 'Alt text' },
        },
      },
    ]);
  });

  it('hydratePostImagesForBuffer falls back when RSS image exceeds 5MB', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.includes('huge.jpg')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({
            'content-type': 'image/jpeg',
            'content-length': String(6 * 1024 * 1024),
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'image/jpeg',
          'content-length': '12000',
        }),
      };
    });

    const hydrated = await hydratePostImagesForBuffer(
      [
        {
          feedId: 'policestationagent',
          slug: 'test',
          title: 'Test',
          excerpt: 'Excerpt',
          url: 'https://www.policestationagent.com/blog/test',
          imageUrl: 'https://www.policestationagent.com/huge.jpg',
          imageAlt: 'Test',
        },
      ],
      'policestationagent',
      fetchMock as unknown as typeof fetch,
    );

    expect(hydrated[0]?.imageUrl).toBe(FEED_DEFAULT_IMAGES.policestationagent);
  });
});

describe('cross-site feed reconciliation (four-site SEO plan)', () => {
  const original = process.env.BUFFER_CONTENT_FEEDS;
  afterEach(() => {
    if (original === undefined) delete process.env.BUFFER_CONTENT_FEEDS;
    else process.env.BUFFER_CONTENT_FEEDS = original;
  });

  it('single-feed override schedules only policestationrepuk (no double-posting psrtrain/custodynote)', () => {
    process.env.BUFFER_CONTENT_FEEDS = JSON.stringify([
      { id: 'policestationrepuk', type: 'local' },
    ]);
    const feeds = getContentFeeds();
    expect(feeds).toHaveLength(1);
    expect(feeds[0].id).toBe('policestationrepuk');
    expect(feeds.map((f) => f.id)).not.toContain('psrtrain');
    expect(feeds.map((f) => f.id)).not.toContain('custodynote');
  });

  it('validateContentFeeds keeps a valid single override (warns on missing IDs, not an error)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = validateContentFeeds([{ id: 'policestationrepuk', type: 'local' }]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('policestationrepuk');
    warn.mockRestore();
  });

  it('invalid JSON override falls back to the default four feeds', () => {
    process.env.BUFFER_CONTENT_FEEDS = 'not-json';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const feeds = getContentFeeds();
    expect(feeds.length).toBeGreaterThanOrEqual(4);
    warn.mockRestore();
  });
});
