import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitSitemapToIndexNow } from '@/lib/indexnow-pipeline';

vi.mock('@/lib/sitemap-build', () => ({
  getSitemapUrlList: vi.fn(async () => [
    'https://policestationrepuk.org/',
    'https://policestationrepuk.org/Blog',
  ]),
}));

describe('submitSitemapToIndexNow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('submits build-time sitemap URLs to IndexNow', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitSitemapToIndexNow({ source: 'build' });

    expect(result.source).toBe('build');
    expect(result.submitted).toBe(2);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
