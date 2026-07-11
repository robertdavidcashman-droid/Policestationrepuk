const HEALTH_CHECK_USER_AGENT = 'PoliceStationRepUK-CommunityHealth/1.0';

export type FacebookGroupHealthResult = {
  ok: boolean;
  status: number | null;
  finalUrl: string | null;
  issue?: string;
};

/** Extract group slug from a facebook.com/groups/{slug} URL. */
export function facebookGroupSlugFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\/groups\/([^/?#]+)/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Verify a Facebook group URL is reachable. A login wall (200) is OK — we only fail on
 * 404+, redirects away from the group slug, or network errors.
 */
export async function checkFacebookGroupUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<FacebookGroupHealthResult> {
  const slug = facebookGroupSlugFromUrl(url);
  if (!slug) {
    return { ok: false, status: null, finalUrl: null, issue: 'Invalid Facebook group URL' };
  }

  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': HEALTH_CHECK_USER_AGENT },
      signal: AbortSignal.timeout(25_000),
    });

    const status = res.status;
    const rawUrl = (res as unknown as { url?: string | (() => string) }).url;
    const finalUrl = typeof rawUrl === 'function' ? String(rawUrl()) : String(rawUrl ?? '');

    if (status >= 404) {
      return { ok: false, status, finalUrl, issue: `HTTP ${status}` };
    }

    const finalHost = (() => {
      try {
        return new URL(finalUrl).hostname.toLowerCase();
      } catch {
        return '';
      }
    })();

    if (!finalHost.endsWith('facebook.com')) {
      return {
        ok: false,
        status,
        finalUrl,
        issue: 'Redirected away from Facebook',
      };
    }

    // Unauthenticated fetches often land on login/checkpoint — that still proves the group URL is valid.
    if (/\/login(?:\.php)?|\/checkpoint\//i.test(finalUrl)) {
      return { ok: true, status, finalUrl };
    }

    const slugNeedle = `/groups/${slug}`.toLowerCase();
    if (!finalUrl.toLowerCase().includes(slugNeedle)) {
      return {
        ok: false,
        status,
        finalUrl,
        issue: 'Redirected away from the expected group URL',
      };
    }

    return { ok: true, status, finalUrl };
  } catch (err) {
    return {
      ok: false,
      status: null,
      finalUrl: null,
      issue: err instanceof Error ? err.message : 'Facebook group health check failed',
    };
  }
}
