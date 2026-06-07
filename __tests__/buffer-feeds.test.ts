import { describe, expect, it } from 'vitest';
import { buildBufferImageAssets, resolveAbsoluteImageUrl } from '@/lib/buffer/assets';
import { loadFeedPosts } from '@/lib/buffer/feeds';
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
});
