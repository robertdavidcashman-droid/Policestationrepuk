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

  it('derives slug from post URL', () => {
    expect(slugFromUrl('https://custodynote.com/blog/my-slug')).toBe('my-slug');
  });
});
