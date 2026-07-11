import { isSerperConfigured, serperSearch, isSearchQueryError } from '@/lib/custody-discovery/search';

export interface SerperWebsiteHit {
  title: string;
  url: string;
  snippet: string;
}

/** Directory / social hosts — not firm homepages (mirrors lead_engine). */
export const DIRECTORY_DOMAINS = [
  'facebook.com',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'wikipedia.org',
  'reviewsolicitors.co.uk',
  'solicitors.lawsociety.org.uk',
  'lawsociety.org.uk',
  'legal500.com',
  'chambers.com',
  'yell.com',
  'thomsonlocal.com',
  'find-open.co.uk',
  'gov.uk',
  'justice.gov.uk',
  'sra.org.uk',
  'trustpilot.com',
  'google.com',
  'youtube.com',
  'instagram.com',
  'companieshouse.gov.uk',
  'yelp.com',
  'indeed.com',
  'glassdoor.com',
  'lawdepot.com',
  'wixsite.com',
  'endole.co.uk',
  'expertini.com',
  'cylex-uk.co.uk',
  'rocketreach.co',
  'leadquest.co.uk',
  'legal-pages.co.uk',
  '192.com',
  'findsolicitor.co.uk',
  'smenews.digital',
  'wheree.com',
  'getsurrey.co.uk',
  'tiktok.com',
  'criminaljusticehub.org.uk',
  'docsity.com',
] as const;

/** Robert's own sites — never firm homepages; crawling them picks up directory/rep emails. */
export const OWN_SITE_DOMAINS = [
  'policestationrepuk.org',
  'policestationrepuk.com',
  'policestationagent.com',
  'psrtrain.com',
  'custodynote.com',
] as const;

const FIRM_NAME_STOPWORDS = new Set(['ltd', 'limited', 'llp', 'solicitors', 'solicitor', 'the']);

export function isOwnSiteUrl(url: string): boolean {
  const ul = url.toLowerCase();
  return OWN_SITE_DOMAINS.some((d) => ul.includes(d));
}

export function isDirectoryOrSocialUrl(url: string): boolean {
  const ul = url.toLowerCase();
  return isOwnSiteUrl(url) || DIRECTORY_DOMAINS.some((d) => ul.includes(d));
}

export function firmNameTokens(firmName: string): string[] {
  return firmName
    .split(/\s+/)
    .map((t) => t.toLowerCase())
    .filter((t) => t.length > 2 && !FIRM_NAME_STOPWORDS.has(t));
}

/** Pick the most likely firm homepage from Serper hits — never fabricate a URL. */
export function pickFirmWebsiteFromResults(
  firmName: string,
  hits: SerperWebsiteHit[],
): string | null {
  const tokens = firmNameTokens(firmName);

  for (const hit of hits) {
    const url = hit.url?.trim();
    if (!url || isDirectoryOrSocialUrl(url)) continue;
    const ul = url.toLowerCase();
    if (tokens.some((tok) => ul.includes(tok))) return url;
  }

  for (const hit of hits) {
    const url = hit.url?.trim();
    if (url && !isDirectoryOrSocialUrl(url)) return url;
  }

  return null;
}

export function buildFirmWebsiteSearchQueries(input: {
  firmName: string;
  town?: string;
  county?: string;
  postcode?: string;
}): string[] {
  const name = input.firmName.trim();
  const region =
    input.town?.trim() ||
    input.county?.trim() ||
    input.postcode?.trim()?.slice(0, 4) ||
    'England';

  return [
    `"${name}" criminal solicitors ${region}`,
    `"${name}" solicitors ${region} contact`,
    `"${name}" duty solicitor ${region}`,
  ];
}

export async function discoverFirmWebsiteViaSerper(
  input: {
    firmName: string;
    town?: string;
    county?: string;
    postcode?: string;
  },
  opts?: { maxQueries?: number },
): Promise<string | null> {
  if (!isSerperConfigured()) return null;

  const maxQueries = opts?.maxQueries ?? 2;
  const queries = buildFirmWebsiteSearchQueries(input).slice(0, maxQueries);
  const seen = new Set<string>();
  const hits: SerperWebsiteHit[] = [];

  for (const q of queries) {
    const rows = await serperSearch(q);
    if (isSearchQueryError(rows)) continue;
    for (const row of rows) {
      const key = row.url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push(row);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  return pickFirmWebsiteFromResults(input.firmName, hits);
}

export { isSerperConfigured };
