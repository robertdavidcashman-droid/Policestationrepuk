import { SITE_URL } from '@/lib/seo-layer/config';

/** Public IndexNow key — verification file lives at `public/{INDEXNOW_KEY}.txt`. */
export const INDEXNOW_KEY = '74a3f2e1b9c84d60a8e7f5b2c1d0e9f8';

export const INDEXNOW_KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_REQUEST = 10_000;

export type IndexNowResult = {
  ok: boolean;
  status: number;
  submitted: number;
  batches: number;
};

function siteHost(): string {
  return new URL(SITE_URL).host;
}

/** Submit one or more absolute URLs to IndexNow (Bing, Yandex, etc.). */
export async function submitIndexNow(urls: string[]): Promise<IndexNowResult> {
  const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return { ok: true, status: 204, submitted: 0, batches: 0 };
  }

  let batches = 0;
  let lastStatus = 204;

  for (let i = 0; i < unique.length; i += MAX_URLS_PER_REQUEST) {
    const chunk = unique.slice(i, i + MAX_URLS_PER_REQUEST);
    batches += 1;
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: siteHost(),
        key: INDEXNOW_KEY,
        keyLocation: INDEXNOW_KEY_LOCATION,
        urlList: chunk,
      }),
    });
    lastStatus = res.status;
    // 200/202 = accepted; 204 = no content (also success for some engines)
    if (!res.ok && res.status !== 202 && res.status !== 204) {
      const body = await res.text().catch(() => '');
      throw new Error(`IndexNow batch ${batches} failed (${res.status}): ${body.slice(0, 200)}`);
    }
  }

  return {
    ok: true,
    status: lastStatus,
    submitted: unique.length,
    batches,
  };
}
