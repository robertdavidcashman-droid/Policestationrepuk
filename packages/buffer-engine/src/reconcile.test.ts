import { describe, expect, it, vi } from 'vitest';
import { countSitePostsInBufferForDay } from './reconcile';

describe('countSitePostsInBufferForDay', () => {
  it('filters posts by site hostname in link URL', async () => {
    const posts = [
      {
        id: '1',
        text: 'Read https://policestationrepuk.org/Blog/foo',
        status: 'scheduled' as const,
        dueAt: '2026-07-04T10:00:00+01:00',
        sentAt: null,
        createdAt: '',
        channelId: 'ch1',
        channelService: 'twitter' as const,
      },
      {
        id: '2',
        text: 'Read https://custodynote.com/blog/bar',
        status: 'scheduled' as const,
        dueAt: '2026-07-04T11:00:00+01:00',
        sentAt: null,
        createdAt: '',
        channelId: 'ch1',
        channelService: 'twitter' as const,
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          data: {
            posts: {
              edges: posts.map((node) => ({ node })),
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        }),
      ),
    );

    const result = await countSitePostsInBufferForDay(
      'test-key',
      'org-id',
      'https://policestationrepuk.org',
      '2026-07-04',
      'Europe/London',
      ['ch1'],
    );

    expect(result.count).toBe(1);
    expect(result.postIds).toEqual(['1']);

    vi.unstubAllGlobals();
  });
});
