import { describe, expect, it } from 'vitest';
import { parseRssItems, slugFromUrl } from '@/lib/buffer/rss';

const SAMPLE_RSS = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test</title>
    <item>
      <title>First Post</title>
      <link>https://custodynote.com/blog/first-post</link>
      <description><![CDATA[Excerpt one.]]></description>
      <guid>https://custodynote.com/blog/first-post</guid>
    </item>
    <item>
      <title>Second Post</title>
      <link>https://custodynote.com/blog/second-post</link>
      <description>Plain excerpt</description>
    </item>
  </channel>
</rss>`;

describe('buffer rss parser', () => {
  it('parses RSS items with title, link, and description', () => {
    const items = parseRssItems(SAMPLE_RSS);
    expect(items).toHaveLength(2);
    expect(items[0]?.title).toBe('First Post');
    expect(items[0]?.description).toBe('Excerpt one.');
    expect(items[1]?.link).toContain('second-post');
  });

  it('extracts enclosure image URLs', () => {
    const xml = `<?xml version="1.0"?><rss><channel><item>
      <title>Photo post</title>
      <link>https://example.com/blog/photo</link>
      <description>Excerpt</description>
      <enclosure url="https://example.com/hero.jpg" type="image/jpeg" length="50000" />
    </item></channel></rss>`;
    const items = parseRssItems(xml);
    expect(items[0]?.imageUrl).toBe('https://example.com/hero.jpg');
  });

  it('extracts media:content and media:thumbnail image URLs', () => {
    const xml = `<?xml version="1.0"?><rss xmlns:media="http://search.yahoo.com/mrss/"><channel><item>
      <title>Media post</title>
      <link>https://example.com/blog/media</link>
      <description>Excerpt</description>
      <media:content url="https://example.com/full.jpg" type="image/jpeg" medium="image" />
      <media:thumbnail url="https://example.com/thumb.jpg" />
    </item></channel></rss>`;
    const items = parseRssItems(xml);
    expect(items[0]?.imageUrl).toBe('https://example.com/full.jpg');
  });

  it('derives slug from post URL', () => {
    expect(slugFromUrl('https://custodynote.com/blog/my-slug')).toBe('my-slug');
  });
});
