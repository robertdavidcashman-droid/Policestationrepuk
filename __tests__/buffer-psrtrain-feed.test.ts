import { describe, expect, it } from 'vitest';
import { getContentFeeds, loadFeedPosts } from '@/lib/buffer/feeds';
import { parseRssItems, slugFromUrl } from '@/lib/buffer/rss';
import { resolveFeedSchedule } from '@/lib/buffer/config';

/** Sample shaped like psrtrain.com/feed output (guides, not /blog). */
const SAMPLE_PSRTRAIN_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PSR Train — PSR Guides</title>
    <link>https://psrtrain.com/guides</link>
    <description>PSRAS, PACE, and exam prep guides for police station representatives in England &amp; Wales.</description>
    <item>
      <title>What is PSRAS? Police Station Representative Accreditation Explained</title>
      <link>https://psrtrain.com/guides/what-is-psras</link>
      <description>PSRAS is the accreditation framework for people who provide legally aided police station advice.</description>
      <guid isPermaLink="true">https://psrtrain.com/guides/what-is-psras</guid>
      <category>PSRAS</category>
      <enclosure url="https://psrtrain.com/images/guides/what-is-psras.jpg" type="image/jpeg" length="50000" />
    </item>
    <item>
      <title>PACE Code C: detention and interview basics</title>
      <link>https://psrtrain.com/guides/pace-code-c-basics</link>
      <description>Core PACE Code C points for custody visits and interview advice.</description>
      <guid isPermaLink="true">https://psrtrain.com/guides/pace-code-c-basics</guid>
      <category>PACE</category>
      <enclosure url="https://psrtrain.com/images/guides/pace-code-c-basics.jpg" type="image/jpeg" length="50000" />
    </item>
  </channel>
</rss>`;

describe('psrtrain buffer feed', () => {
  it('default feeds include psrtrain RSS at 2 posts per day (1 day + 1 night)', () => {
    const feeds = getContentFeeds();
    const psrtrain = feeds.find((f) => f.id === 'psrtrain');
    expect(psrtrain).toMatchObject({
      type: 'rss',
      url: 'https://psrtrain.com/feed',
      postsPerDay: 2,
      dayPosts: 1,
      nightPosts: 1,
    });
    expect(resolveFeedSchedule(psrtrain!)).toEqual({
      postsPerFeed: 2,
      dayPosts: 1,
      nightPosts: 1,
    });
  });

  it('parses psrtrain guide URLs into slugs', () => {
    const items = parseRssItems(SAMPLE_PSRTRAIN_RSS);
    expect(items).toHaveLength(2);
    expect(slugFromUrl(items[0]!.link)).toBe('what-is-psras');
    expect(slugFromUrl(items[1]!.link)).toBe('pace-code-c-basics');
  });

  it('loadFeedPosts maps psrtrain RSS into schedulable posts', async () => {
    const posts = await loadFeedPosts(
      { id: 'psrtrain', type: 'rss', url: 'https://psrtrain.com/feed' },
      async () => SAMPLE_PSRTRAIN_RSS,
    );

    expect(posts).toHaveLength(2);
    expect(posts[0]).toMatchObject({
      feedId: 'psrtrain',
      slug: 'what-is-psras',
      url: 'https://psrtrain.com/guides/what-is-psras',
    });
    expect(posts[0]!.excerpt).toContain('accreditation framework');
    expect(posts.every((p) => p.url.includes('/guides/'))).toBe(true);
    expect(posts[0]!.imageUrl).toBe('https://psrtrain.com/images/guides/what-is-psras.jpg');
    expect(posts[1]!.imageUrl).toBe('https://psrtrain.com/images/guides/pace-code-c-basics.jpg');
  });
});
