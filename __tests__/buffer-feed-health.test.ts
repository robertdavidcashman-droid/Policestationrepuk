import { describe, expect, it, vi } from 'vitest';
import { loadAllFeedPosts } from '@/lib/buffer/feeds';

function mockBufferImageFetch(): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers({
      'content-type': 'image/jpeg',
      'content-length': '50000',
    }),
  }) as unknown as typeof fetch;
}

const FIXTURES: Record<string, string> = {
  custodynote: `<?xml version="1.0"?><rss><channel>
    <item><title>A</title><link>https://custodynote.com/blog/a</link><description>x</description>
      <enclosure url="https://custodynote.com/img/a.png" type="image/png" length="1" /></item>
    <item><title>B</title><link>https://custodynote.com/blog/b</link><description>x</description>
      <enclosure url="https://custodynote.com/img/b.png" type="image/png" length="1" /></item>
    <item><title>C</title><link>https://custodynote.com/blog/c</link><description>x</description>
      <enclosure url="https://custodynote.com/img/c.png" type="image/png" length="1" /></item>
  </channel></rss>`,
  policestationagent: `<?xml version="1.0"?><rss><channel>
    <item><title>A</title><link>https://www.policestationagent.com/blog/a</link><description>x</description>
      <enclosure url="https://www.policestationagent.com/img/a.jpg" type="image/jpeg" length="1" /></item>
    <item><title>B</title><link>https://www.policestationagent.com/blog/b</link><description>x</description>
      <enclosure url="https://www.policestationagent.com/img/b.jpg" type="image/jpeg" length="1" /></item>
    <item><title>C</title><link>https://www.policestationagent.com/blog/c</link><description>x</description>
      <enclosure url="https://www.policestationagent.com/img/c.jpg" type="image/jpeg" length="1" /></item>
  </channel></rss>`,
  psrtrain: `<?xml version="1.0"?><rss><channel>
    <item><title>A</title><link>https://psrtrain.com/guides/a</link><description>x</description></item>
    <item><title>B</title><link>https://psrtrain.com/guides/b</link><description>x</description></item>
    <item><title>C</title><link>https://psrtrain.com/guides/c</link><description>x</description></item>
  </channel></rss>`,
};

describe('buffer feed health', () => {
  it('loads all default feeds without errors using fixtures', async () => {
    const { posts, errors } = await loadAllFeedPosts(async (url) => {
      if (url.includes('custodynote.com')) return FIXTURES.custodynote!;
      if (url.includes('policestationagent.com')) return FIXTURES.policestationagent!;
      if (url.includes('psrtrain.com')) return FIXTURES.psrtrain!;
      throw new Error(`Unexpected URL ${url}`);
    }, { imageFetch: mockBufferImageFetch() });

    expect(errors).toEqual([]);
    expect((posts.get('policestationrepuk') ?? []).length).toBeGreaterThanOrEqual(3);
    expect(posts.get('custodynote')?.length).toBeGreaterThanOrEqual(3);
    expect(posts.get('policestationagent')?.length).toBeGreaterThanOrEqual(3);
    expect(posts.get('psrtrain')?.length).toBeGreaterThanOrEqual(3);

    for (const post of posts.get('policestationrepuk') ?? []) {
      expect(post.imageUrl).toBeTruthy();
    }
    for (const post of posts.get('custodynote') ?? []) {
      expect(post.imageUrl).toBeTruthy();
    }
    for (const post of posts.get('psrtrain') ?? []) {
      expect(post.imageUrl).toBe('https://psrtrain.com/opengraph-image');
    }
  });

  it('records per-feed errors without aborting other feeds', async () => {
    const { posts, errors } = await loadAllFeedPosts(async (url) => {
      if (url.includes('custodynote.com')) throw new Error('HTTP 503');
      if (url.includes('policestationagent.com')) return FIXTURES.policestationagent!;
      if (url.includes('psrtrain.com')) return FIXTURES.psrtrain!;
      throw new Error(`Unexpected URL ${url}`);
    }, { imageFetch: mockBufferImageFetch() });

    expect(errors.some((e) => e.feedId === 'custodynote')).toBe(true);
    expect((posts.get('custodynote') ?? []).length).toBe(0);
    expect((posts.get('policestationagent') ?? []).length).toBeGreaterThan(0);
  });
});
