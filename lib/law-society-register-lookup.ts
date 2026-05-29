import { lookupSraPerson, type SraLookupResult } from '@/lib/sra-register-lookup';

/**
 * Law Society "Find a Solicitor" is fed from the same SRA public register data
 * (see sra.org.uk data-sharing guidance). Direct server-side scraping is blocked
 * by their WAF, so we verify via the SRA person register — the authoritative source.
 */
export interface LawSocietyPersonRecord {
  name: string;
  sraNumber: string;
}

export interface LawSocietyLookupResult {
  found: boolean;
  matched: boolean;
  source: 'law-society-direct' | 'sra-register-equivalent' | null;
  person: LawSocietyPersonRecord | null;
  error?: string;
}

export async function lookupLawSocietyPerson(
  input: {
    name: string;
    sraNumber?: string;
  },
  existingSra?: SraLookupResult,
): Promise<LawSocietyLookupResult> {
  const direct = await tryDirectLawSocietySearch(input.name);
  if (direct) return direct;

  const sra = existingSra ?? (await lookupSraPerson(input));
  if (sra.error === 'fetch_failed') {
    return {
      found: false,
      matched: false,
      source: 'sra-register-equivalent',
      person: null,
      error: 'lookup_failed',
    };
  }

  return {
    found: sra.found,
    matched: sra.matched,
    source: 'sra-register-equivalent',
    person: sra.person
      ? { name: sra.person.name, sraNumber: sra.person.sraNumber }
      : null,
  };
}

async function tryDirectLawSocietySearch(name: string): Promise<LawSocietyLookupResult | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const url = `https://solicitors.lawsociety.org.uk/search/results?type=0&name=${encodeURIComponent(trimmed)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; PoliceStationRepUK/1.0; +https://policestationrepuk.org)',
        Accept: 'text/html',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (html.includes('captcha') || html.includes('blocked') || html.includes('Service unavailable')) {
      return null;
    }
    const people = parseLawSocietySearchResults(html);
    if (people.length === 0) {
      return { found: false, matched: false, source: 'law-society-direct', person: null };
    }
    const person = people[0];
    return {
      found: true,
      matched: true,
      source: 'law-society-direct',
      person,
    };
  } catch {
    return null;
  }
}

function parseLawSocietySearchResults(html: string): LawSocietyPersonRecord[] {
  const results: LawSocietyPersonRecord[] = [];
  const nameRe = /class="[^"]*solicitor-name[^"]*"[^>]*>([^<]+)</gi;
  let m: RegExpExecArray | null;
  while ((m = nameRe.exec(html))) {
    const name = m[1].replace(/\s+/g, ' ').trim();
    if (name) results.push({ name, sraNumber: '' });
  }
  return results;
}
