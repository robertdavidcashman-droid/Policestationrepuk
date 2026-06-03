/**
 * BSB authorised barristers register — cached CSV lookup by name or chambers.
 */
import { namesLikelyMatch, normalizePersonName } from '@/lib/name-match';

const BSB_CSV_URL =
  'https://www.barstandardsboard.org.uk/asset/55AEDEAE%2D4A33%2D4D31%2DB673038F6FBB473C/';
const FETCH_HEADERS = {
  'User-Agent': 'PoliceStationRepUK/1.0 (+https://policestationrepuk.org)',
  Accept: 'text/csv,text/plain,*/*',
} as const;

export interface BsbBarristerRecord {
  name: string;
  organisation: string;
  practisingCertificateValid: string;
}

export interface BsbLookupResult {
  found: boolean;
  matched: boolean;
  person: BsbBarristerRecord | null;
  error?: string;
}

let _cache: { syncedAt: number; rows: BsbBarristerRecord[] } | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseBsbRegisterCsv(text: string): BsbBarristerRecord[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const iFore = headers.indexOf('forenames');
  const iSur = headers.indexOf('surname');
  const iOrg = headers.indexOf('address name');
  const iPc = headers.findIndex((h) => h.includes('practising certificate'));
  if (iFore < 0 || iSur < 0) return [];

  const rows: BsbBarristerRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const fore = cols[iFore]?.trim() ?? '';
    const sur = cols[iSur]?.trim() ?? '';
    if (!fore && !sur) continue;
    rows.push({
      name: `${fore} ${sur}`.trim(),
      organisation: iOrg >= 0 ? (cols[iOrg]?.trim() ?? '') : '',
      practisingCertificateValid: iPc >= 0 ? (cols[iPc]?.trim() ?? '') : '',
    });
  }
  return rows;
}

async function loadRegister(): Promise<BsbBarristerRecord[]> {
  const now = Date.now();
  if (_cache && now - _cache.syncedAt < CACHE_TTL_MS) return _cache.rows;

  const res = await fetch(BSB_CSV_URL, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`BSB CSV fetch failed: ${res.status}`);
  const text = await res.text();
  const rows = parseBsbRegisterCsv(text);
  _cache = { syncedAt: now, rows };
  return rows;
}

function orgMatches(org: string, businessName: string): boolean {
  const a = org.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  const b = businessName.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

/** Match a barrister by person name or chambers / organisation name. */
export async function lookupBsbPerson(input: {
  name: string;
  businessName?: string;
}): Promise<BsbLookupResult> {
  const queryName = input.name.trim();
  if (!queryName) {
    return { found: false, matched: false, person: null, error: 'empty_name' };
  }

  try {
    const rows = await loadRegister();
    const byPerson =
      rows.find((r) => normalizePersonName(r.name) === normalizePersonName(queryName)) ??
      rows.find((r) => namesLikelyMatch(queryName, r.name)) ??
      null;

    if (byPerson && byPerson.practisingCertificateValid) {
      return { found: true, matched: true, person: byPerson };
    }

    if (input.businessName) {
      const byOrg = rows.find(
        (r) => r.organisation && orgMatches(r.organisation, input.businessName!),
      );
      if (byOrg) return { found: true, matched: true, person: byOrg };
    }

    return { found: Boolean(byPerson), matched: false, person: byPerson };
  } catch (err) {
    return {
      found: false,
      matched: false,
      person: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Reset in-memory cache (tests). */
export function resetBsbRegisterCacheForTests(): void {
  _cache = null;
}
