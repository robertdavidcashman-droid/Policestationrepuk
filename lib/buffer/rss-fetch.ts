import { POLICESTATIONAGENT_SITE } from '@/lib/policestationagent-promo';
import { SITE_URL } from '@/lib/seo-layer/config';

const RSS_USER_AGENT =
  'PoliceStationRepUK-Buffer/1.0 (+https://policestationrepuk.org; RSS feed reader)';

export const POLICESTATIONAGENT_FEED_PROXY = `${SITE_URL.replace(/\/$/, '')}/api/feeds/policestationagent`;

const AGENT_UPSTREAM_URLS = [
  `${POLICESTATIONAGENT_SITE}/feed.xml`,
  `${POLICESTATIONAGENT_SITE}/feed`,
  `${POLICESTATIONAGENT_SITE}/rss.xml`,
];

function isPolicestationAgentFeed(url: string): boolean {
  return url.includes('policestationagent.com');
}

/** Expand a feed URL into ordered fetch candidates (original, alternates, first-party proxy). */
export function rssFetchCandidates(url: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (candidate: string) => {
    const trimmed = candidate.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    out.push(trimmed);
  };

  push(url);

  if (isPolicestationAgentFeed(url)) {
    for (const alt of AGENT_UPSTREAM_URLS) push(alt);
    push(POLICESTATIONAGENT_FEED_PROXY);
  }

  return out;
}

async function fetchRssOnce(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml, */*',
      'User-Agent': RSS_USER_AGENT,
    },
    signal: AbortSignal.timeout(20_000),
    next: url.startsWith(POLICESTATIONAGENT_FEED_PROXY) ? undefined : { revalidate: 300 },
  });
}

/** Fetch RSS XML from upstream (used by the first-party proxy route). */
export async function fetchUpstreamRssXml(upstreamUrl: string): Promise<string> {
  const candidates = isPolicestationAgentFeed(upstreamUrl)
    ? AGENT_UPSTREAM_URLS
    : [upstreamUrl];

  let lastStatus = 0;
  let lastError = '';

  for (const candidate of candidates) {
    try {
      const res = await fetchRssOnce(candidate);
      if (res.ok) return await res.text();
      lastStatus = res.status;
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'fetch failed';
    }
  }

  throw new Error(
    `Feed fetch failed ${upstreamUrl}${lastStatus ? `: HTTP ${lastStatus}` : ''}${lastError ? ` (${lastError})` : ''}`,
  );
}

/** Resilient RSS fetch with alternate paths and first-party proxy fallback. */
export async function fetchRssWithFallback(url: string): Promise<string> {
  const candidates = rssFetchCandidates(url);
  let lastError = '';

  for (const candidate of candidates) {
    try {
      const res = await fetchRssOnce(candidate);
      if (res.ok) return await res.text();
      lastError = `Feed fetch failed ${candidate}: HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : `Feed fetch failed ${candidate}`;
    }
  }

  throw new Error(lastError || `Feed fetch failed ${url}`);
}
