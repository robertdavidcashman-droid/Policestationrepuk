import { SITE_URL } from '@/lib/seo-layer/config';

const BING_ENDPOINT = 'https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch';
const BING_BATCH_SIZE = 500;
/** Bing daily URL submission quota for new sites is small — cap per run. */
const DEFAULT_DAILY_CAP = 100;

export type BingSubmitResult = {
  ok: boolean;
  skipped?: boolean;
  submitted: number;
  batches: number;
  message?: string;
};

/**
 * Submit absolute URLs directly to the Bing Webmaster URL Submission API.
 * Stronger signal than IndexNow and most improves DuckDuckGo (Bing-backed).
 * No-op when BING_WEBMASTER_API_KEY is unset (IndexNow still covers Bing).
 */
export async function submitToBing(
  urls: string[],
  options?: { cap?: number },
): Promise<BingSubmitResult> {
  const apiKey = process.env.BING_WEBMASTER_API_KEY?.trim();
  if (!apiKey) {
    return { ok: true, skipped: true, submitted: 0, batches: 0, message: 'no BING_WEBMASTER_API_KEY' };
  }

  const cap = options?.cap ?? DEFAULT_DAILY_CAP;
  const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))].slice(0, cap);
  if (unique.length === 0) {
    return { ok: true, submitted: 0, batches: 0 };
  }

  let batches = 0;
  for (let i = 0; i < unique.length; i += BING_BATCH_SIZE) {
    const chunk = unique.slice(i, i + BING_BATCH_SIZE);
    batches += 1;
    const res = await fetch(`${BING_ENDPOINT}?apikey=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ siteUrl: SITE_URL, urlList: chunk }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return {
        ok: false,
        submitted: i,
        batches,
        message: `Bing batch ${batches} failed (${res.status}): ${body.slice(0, 200)}`,
      };
    }
  }

  return { ok: true, submitted: unique.length, batches };
}
