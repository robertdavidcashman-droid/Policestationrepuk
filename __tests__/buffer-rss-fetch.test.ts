import { describe, expect, it, vi } from 'vitest';
import { rssFetchCandidates, POLICESTATIONAGENT_FEED_PROXY } from '@/lib/buffer/rss-fetch';

describe('buffer rss-fetch', () => {
  it('includes proxy fallback for policestationagent feeds', () => {
    const candidates = rssFetchCandidates('https://www.policestationagent.com/feed.xml');
    expect(candidates.some((u) => u.includes('policestationagent.com/feed'))).toBe(true);
    expect(candidates).toContain(POLICESTATIONAGENT_FEED_PROXY);
  });

  it('does not add proxy for unrelated feeds', () => {
    const candidates = rssFetchCandidates('https://custodynote.com/feed');
    expect(candidates).toEqual(['https://custodynote.com/feed']);
  });

  it('fetchRssWithFallback tries next candidate on failure', async () => {
    const { fetchRssWithFallback } = await import('@/lib/buffer/rss-fetch');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 403 }))
      .mockResolvedValueOnce(new Response('<rss>ok</rss>', { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const xml = await fetchRssWithFallback('https://www.policestationagent.com/feed.xml');
    expect(xml).toBe('<rss>ok</rss>');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
  });
});
