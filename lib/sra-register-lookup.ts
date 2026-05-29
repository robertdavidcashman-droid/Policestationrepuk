import { namesLikelyMatch, normalizePersonName } from '@/lib/name-match';

const SRA_BASE = 'https://beta.sra.org.uk';
const FETCH_HEADERS = {
  'User-Agent': 'PoliceStationRepUK/1.0 (+https://policestationrepuk.org)',
  Accept: 'text/html',
} as const;

export interface SraPersonRecord {
  sraNumber: string;
  name: string;
  regulated: boolean;
  typeOfLawyer?: string;
}

export interface SraLookupResult {
  found: boolean;
  matched: boolean;
  source: 'sra-number' | 'sra-name-search' | null;
  person: SraPersonRecord | null;
  error?: string;
}

function decodeHtml(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseSraPersonPage(html: string): SraPersonRecord | null {
  const name = html.match(/<h1 class="reg__detail__h1">([^<]+)<\/h1>/)?.[1];
  if (!name) return null;

  const sraNumber =
    html.match(/<strong>SRA number<\/strong>[\s\S]*?<dd>\s*(\d+)\s*<\/dd>/i)?.[1] ??
    html.match(/SRA number[\s\S]*?<dd>\s*(\d+)\s*<\/dd>/i)?.[1] ??
    '';

  const regulated =
    html.includes('SRA-regulated solicitor') ||
    html.includes('SRA-regulated lawyer') ||
    html.includes('PracticingSolicitorLabel');

  const typeOfLawyer = html.match(/<strong>Type of lawyer<\/strong>[\s\S]*?<dd>\s*([^<]+)/i)?.[1];

  return {
    sraNumber: sraNumber.trim(),
    name: decodeHtml(name),
    regulated,
    typeOfLawyer: typeOfLawyer ? decodeHtml(typeOfLawyer) : undefined,
  };
}

export function parseSraPersonSearchResults(html: string): SraPersonRecord[] {
  const results: SraPersonRecord[] = [];
  const blockRe =
    /goToPersonDetails\((\d+)\)[\s\S]*?<h2 class="h5 h2-no-border">\s*([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(html))) {
    results.push({
      sraNumber: m[1],
      name: decodeHtml(m[2]),
      regulated: true,
    });
  }
  return results;
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
    console.warn('[sra-register-lookup] fetch failed:', path, err);
    return null;
  }
}

export async function lookupSraPersonByNumber(
  sraNumber: string,
  expectedName?: string,
): Promise<SraLookupResult> {
  const num = sraNumber.replace(/\D/g, '');
  if (!num) {
    return { found: false, matched: false, source: null, person: null, error: 'invalid_sra_number' };
  }

  const html = await fetchSra(`/consumers/register/person/?sraNumber=${encodeURIComponent(num)}`);
  if (!html) {
    return { found: false, matched: false, source: null, person: null, error: 'fetch_failed' };
  }

  const person = parseSraPersonPage(html);
  if (!person) {
    return { found: false, matched: false, source: null, person: null };
  }

  const matched =
    person.regulated &&
    (!expectedName || namesLikelyMatch(expectedName, person.name));

  return {
    found: true,
    matched,
    source: 'sra-number',
    person,
  };
}

export async function lookupSraPersonByName(name: string): Promise<SraLookupResult> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { found: false, matched: false, source: null, person: null, error: 'empty_name' };
  }

  const html = await fetchSra(
    `/consumers/register/?searchFilter=Person&searchText=${encodeURIComponent(trimmed)}`,
  );
  if (!html) {
    return { found: false, matched: false, source: null, person: null, error: 'fetch_failed' };
  }

  const people = parseSraPersonSearchResults(html);
  if (people.length === 0) {
    return { found: false, matched: false, source: null, person: null };
  }

  const person =
    people.find((p) => normalizePersonName(p.name) === normalizePersonName(trimmed)) ??
    people.find((p) => namesLikelyMatch(trimmed, p.name)) ??
    null;

  if (!person) {
    return { found: true, matched: false, source: 'sra-name-search', person: null };
  }

  return {
    found: true,
    matched: true,
    source: 'sra-name-search',
    person,
  };
}

/** Prefer SRA number lookup; fall back to name search. */
export async function lookupSraPerson(input: {
  name: string;
  sraNumber?: string;
}): Promise<SraLookupResult> {
  if (input.sraNumber?.trim()) {
    const byNumber = await lookupSraPersonByNumber(input.sraNumber, input.name);
    if (byNumber.matched) return byNumber;
    if (byNumber.found) return byNumber;
  }
  return lookupSraPersonByName(input.name);
}
