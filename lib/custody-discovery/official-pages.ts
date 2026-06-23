import { normaliseStationName } from '@/lib/custody-station';
import { extractPhonesFromText, hasCustodyWordingNear } from './phone';
import type { CustodySuite, SearchResult } from './types';

const FETCH_TIMEOUT_MS = 12_000;

/** Force-wide custody listing pages (verified public URLs). */
export const FORCE_CUSTODY_PAGES: Record<string, string[]> = {
  'devon and cornwall police': [
    'https://www.devon-cornwall.police.uk/contact/custody-information',
  ],
  'kent police': ['https://www.kent.police.uk/contact/'],
  'thames valley police': ['https://www.thamesvalley.police.uk/contact/'],
  'metropolitan police': ['https://www.met.police.uk/contact/af/contact-us/'],
  'west midlands police': [
    'https://www.west-midlands.police.uk/contact/custody-information',
    'https://www.west-midlands.police.uk/contact',
  ],
  'essex police': ['https://www.essex.police.uk/contact/custody-information'],
  'hampshire constabulary': ['https://www.hampshire.police.uk/contact/custody-information'],
  'surrey police': ['https://www.surrey.police.uk/contact/custody-information'],
  'sussex police': ['https://www.sussex.police.uk/contact/custody-information'],
  'lancashire constabulary': ['https://www.lancashire.police.uk/contact/custody-information'],
  'hertfordshire constabulary': ['https://www.herts.police.uk/contact/custody-information'],
  'west yorkshire police': ['https://www.westyorkshire.police.uk/contact/custody-information'],
  'northamptonshire police': ['https://www.northants.police.uk/contact/custody-information'],
  'greater manchester police': ['https://www.gmp.police.uk/contact/custody-information'],
  'british transport police': ['https://www.btp.police.uk/contact/'],
};

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function suiteNameTokens(name: string): string[] {
  return normaliseStationName(name)
    .split(/\s+/)
    .filter((t) => t.length >= 4);
}

function pageMentionsSuite(text: string, suite: CustodySuite): boolean {
  const norm = normaliseStationName(text);
  const stationNorm = normaliseStationName(suite.policeStationName);
  const suiteNorm = normaliseStationName(suite.custodySuiteName);
  if (stationNorm && norm.includes(stationNorm)) return true;
  if (suiteNorm && norm.includes(suiteNorm)) return true;
  const tokens = suiteNameTokens(suite.custodySuiteName);
  return tokens.length > 0 && tokens.filter((t) => norm.includes(t)).length >= Math.min(2, tokens.length);
}

function buildCandidateUrls(suite: CustodySuite): string[] {
  const domain = suite.forceDomain.replace(/^www\./, '');
  const forceKey = suite.forceName.toLowerCase().trim();
  const urls = new Set<string>();

  for (const u of FORCE_CUSTODY_PAGES[forceKey] ?? []) urls.add(u);

  const paths = [
    '/contact/custody-information',
    '/contact/custody',
    '/contact/custody-suites',
    '/contact',
    '/advice/contact-us',
  ];
  for (const path of paths) {
    urls.add(`https://www.${domain}${path}`);
    urls.add(`https://${domain}${path}`);
  }

  return [...urls];
}

async function fetchPageText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PoliceStationRepUK-CustodyDiscovery/1.0 (+https://policestationrepuk.org)',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return htmlToText(html);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function phonesForSuiteFromPage(text: string, suite: CustodySuite, url: string): SearchResult[] {
  const results: SearchResult[] = [];
  const phones = extractPhonesFromText(text, 120, suite.forceName);
  const seen = new Set<string>();

  for (const phone of phones) {
    if (seen.has(phone.normalized)) continue;
    const relevant =
      hasCustodyWordingNear(phone.context) ||
      pageMentionsSuite(phone.context, suite) ||
      pageMentionsSuite(text, suite);
    if (!relevant) continue;
    seen.add(phone.normalized);
    results.push({
      title: `${suite.forceName} — ${suite.custodySuiteName}`,
      url,
      snippet: phone.context,
    });
  }

  return results;
}

/**
 * Fetch official force custody pages (runs in parallel with Serper on every crawl).
 * Returns hits where page text mentions the suite and a phone near custody wording.
 */
export async function fetchOfficialSources(suite: CustodySuite): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const urls = buildCandidateUrls(suite);
  const seenUrls = new Set<string>();

  for (const url of urls) {
    const text = await fetchPageText(url);
    if (!text) continue;

    const suiteRelevant = pageMentionsSuite(text, suite) || hasCustodyWordingNear(text);
    if (!suiteRelevant) continue;

    for (const hit of phonesForSuiteFromPage(text, suite, url)) {
      const key = `${hit.url}:${hit.snippet.slice(0, 40)}`;
      if (seenUrls.has(key)) continue;
      seenUrls.add(key);
      results.push(hit);
    }
  }

  return results;
}
