import { afterEach, describe, expect, it, vi } from 'vitest';
import { INDEXNOW_KEY, INDEXNOW_KEY_LOCATION, submitIndexNow } from '@/lib/indexnow';

describe('submitIndexNow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts url batches to IndexNow API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitIndexNow([
      'https://policestationrepuk.org/',
      'https://policestationrepuk.org/Blog',
    ]);

    expect(result.ok).toBe(true);
    expect(result.submitted).toBe(2);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.key).toBe(INDEXNOW_KEY);
    expect(body.keyLocation).toBe(INDEXNOW_KEY_LOCATION);
    expect(body.urlList).toEqual([
      'https://policestationrepuk.org/',
      'https://policestationrepuk.org/Blog',
    ]);
  });

  it('deduplicates URLs', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204, text: async () => '' });
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitIndexNow([
      'https://policestationrepuk.org/FAQ',
      'https://policestationrepuk.org/FAQ',
    ]);

    expect(result.submitted).toBe(1);
  });
});
