import { namesLikelyMatch } from '@/lib/name-match';
import { FIRM_OUTREACH_UA } from './constants';

const SRA_BASE = 'https://www.sra.org.uk';

export interface SraOrganisationRecord {
  sraNumber: string;
  name: string;
  website?: string;
  postcode?: string;
  status?: string;
  authorised: boolean;
}

export interface SraOrgLookupResult {
  found: boolean;
  matched: boolean;
  organisation: SraOrganisationRecord | null;
  error?: string;
}

const FETCH_HEADERS = {
  'User-Agent': FIRM_OUTREACH_UA,
  Accept: 'text/html',
} as const;

function decodeHtml(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeWebsite(raw: string | undefined): string | undefined {
  const w = raw?.trim();
  if (!w || w.startsWith('#')) return undefined;
  if (/^https?:\/\//i.test(w)) return w;
  if (w.startsWith('www.')) return `https://${w}`;
  if (/^[a-z0-9][-a-z0-9]*(\.[a-z0-9][-a-z0-9]*)+/i.test(w)) return `https://${w}`;
  return undefined;
}

export function parseSraOrganisationSearchResults(html: string): SraOrganisationRecord[] {
  const results: SraOrganisationRecord[] = [];
  const blockRe =
    /goToOrg(?:anisation)?Details\((\d+)\)[\s\S]*?<h2 class="h5 h2-no-border">\s*([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(html))) {
    results.push({
      sraNumber: m[1],
      name: decodeHtml(m[2]),
      authorised: true,
    });
  }
  return results;
}

export function parseSraOrganisationPage(html: string): SraOrganisationRecord | null {
  const name = html.match(/<h1 class="reg__detail__h1">([^<]+)<\/h1>/)?.[1];
  if (!name) return null;

  const sraNumber =
    html.match(/<strong>SRA number<\/strong>[\s\S]*?<dd>\s*(\d+)\s*<\/dd>/i)?.[1] ?? '';

  const websiteFromBlock = html.match(
    /<div class="label__list__details">[\s\S]*?<strong>Website<\/strong>[\s\S]*?<dd>\s*([^<]+)/i,
  )?.[1]?.trim();

  const websiteRaw =
    websiteFromBlock ??
    html.match(/<strong>Website<\/strong>[\s\S]*?<dd>[\s\S]*?href="([^"#]+)/i)?.[1]?.trim() ??
    html.match(/<strong>Website address<\/strong>[\s\S]*?<dd>[\s\S]*?href="([^"#]+)/i)?.[1]?.trim() ??
    html.match(/<strong>Website<\/strong>[\s\S]*?<dd>\s*([^<]+)/i)?.[1]?.trim() ??
    html.match(/<strong>Website address<\/strong>[\s\S]*?<dd>\s*([^<]+)/i)?.[1]?.trim();

  const postcode =
    html.match(/<strong>Postcode<\/strong>[\s\S]*?<dd>\s*([^<]+)/i)?.[1]?.trim();

  const typeOfFirm =
    html.match(/<strong>Type of firm<\/strong>[\s\S]*?<dd>\s*([^<]+)/i)?.[1]?.trim();

  const status =
    html.match(/<strong>Authorisation status<\/strong>[\s\S]*?<dd>\s*([^<]+)/i)?.[1]?.trim() ??
    html.match(/<strong>Status<\/strong>[\s\S]*?<dd>\s*([^<]+)/i)?.[1]?.trim();

  const authBlob = `${status ?? ''} ${typeOfFirm ?? ''}`;
  const authorised =
    /authoris|recognised body/i.test(authBlob) &&
    !/not authoris|ceased|closed|revoked/i.test(authBlob);

  return {
    sraNumber: sraNumber.trim(),
    name: decodeHtml(name),
    website: normalizeWebsite(websiteRaw ? decodeHtml(websiteRaw) : undefined),
    postcode: postcode ? decodeHtml(postcode) : undefined,
    status: status ? decodeHtml(status) : undefined,
    authorised,
  };
}

async function fetchSra(path: string): Promise<string | null> {
  try {
    const res = await fetch(`${SRA_BASE}${path}`, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(15_000),
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.warn('[sra-org-lookup] fetch failed:', path, err);
    return null;
  }
}

export async function lookupSraOrganisationByNumber(
  sraNumber: string,
): Promise<SraOrgLookupResult> {
  const num = sraNumber.replace(/\D/g, '');
  if (!num) {
    return { found: false, matched: false, organisation: null, error: 'invalid_sra_number' };
  }

  const html = await fetchSra(
    `/consumers/register/organisation/?sraNumber=${encodeURIComponent(num)}`,
  );
  if (!html) {
    return { found: false, matched: false, organisation: null, error: 'fetch_failed' };
  }

  const organisation = parseSraOrganisationPage(html);
  if (!organisation) {
    return { found: false, matched: false, organisation: null };
  }

  return {
    found: true,
    matched: organisation.authorised,
    organisation,
  };
}

export async function lookupSraOrganisationByName(
  firmName: string,
  expectedPostcode?: string,
): Promise<SraOrgLookupResult> {
  const q = firmName.trim();
  if (!q) {
    return { found: false, matched: false, organisation: null, error: 'empty_name' };
  }

  const html = await fetchSra(
    `/consumers/register/?SearchFilter=Organisation&searchText=${encodeURIComponent(q)}`,
  );
  if (!html) {
    return { found: false, matched: false, organisation: null, error: 'fetch_failed' };
  }

  const results = parseSraOrganisationSearchResults(html);
  if (!results.length) {
    return { found: false, matched: false, organisation: null };
  }

  let pick = results.find((r) => namesLikelyMatch(firmName, r.name));
  if (!pick) pick = results[0];

  const detail = await lookupSraOrganisationByNumber(pick.sraNumber);
  if (!detail.organisation) {
    return detail;
  }

  const pc = (expectedPostcode ?? '').replace(/\s+/g, '').toUpperCase();
  const orgPc = (detail.organisation.postcode ?? '').replace(/\s+/g, '').toUpperCase();
  const postcodeMatch =
    !pc || !orgPc || orgPc.startsWith(pc.slice(0, 3)) || pc.startsWith(orgPc.slice(0, 3));

  return {
    found: true,
    matched:
      detail.organisation.authorised &&
      namesLikelyMatch(firmName, detail.organisation.name) &&
      postcodeMatch,
    organisation: detail.organisation,
  };
}
