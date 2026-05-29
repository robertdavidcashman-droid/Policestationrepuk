import { getKV, skipKVInPrerender } from '@/lib/kv';
import { namesLikelyMatch, normalizePersonName } from '@/lib/name-match';

const DSCC_REGISTER_URL = 'https://www.dutysolicitors.org/ords/f?p=109:45::::::';
const DSCC_AJAX_URL = 'https://www.dutysolicitors.org/ords/wwv_flow.ajax';
const DSCC_CACHE_KEY = 'dscc-register:v1';
const DSCC_CACHE_TTL_SECONDS = 24 * 60 * 60;
const ROWS_PER_PAGE = 50;
const MAX_PAGES = 400; // safety cap (~20k rows)

const FETCH_HEADERS = {
  'User-Agent': 'PoliceStationRepUK/1.0 (+https://policestationrepuk.org)',
  Accept: 'text/html',
} as const;

export interface DsccRegisterEntry {
  title: string;
  forename: string;
  surname: string;
  firm: string;
}

export interface DsccRegisterCache {
  syncedAt: string;
  count: number;
  entries: DsccRegisterEntry[];
}

export interface DsccLookupResult {
  found: boolean;
  matched: boolean;
  entries: DsccRegisterEntry[];
  cacheAgeMs: number | null;
  error?: string;
}

interface DsccSession {
  cookie: string;
  pInstance: string;
  pSalt: string;
  ajaxId: string;
  worksheetId: string;
  reportId: string;
}

function decodeHtml(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseDsccRegisterRows(html: string): DsccRegisterEntry[] {
  const rows: DsccRegisterEntry[] = [];
  for (const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    if (!m[1].includes('headers=')) continue;
    const cells = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) =>
      decodeHtml(c[1].replace(/<[^>]+>/g, '')),
    );
    if (cells.length < 3) continue;
    rows.push({
      title: cells[0] ?? '',
      forename: cells[1] ?? '',
      surname: cells[2] ?? '',
      firm: cells[6] ?? '',
    });
  }
  return rows;
}

function parseDsccSession(html: string): Omit<DsccSession, 'cookie'> | null {
  const pInstance = html.match(/name="p_instance" value="(\d+)"/)?.[1];
  const pSalt = html.match(/value="([^"]+)"\s+id="pSalt"/)?.[1];
  const ajaxId = html.match(/"ajaxIdentifier":"([^"]+)"/)?.[1]?.replace(/\\u002F/g, '/');
  const worksheetId = html.match(/id="R6174600793986026268_worksheet_id" value="(\d+)"/)?.[1];
  const reportId = html.match(/id="R6174600793986026268_report_id" value="(\d+)"/)?.[1];
  if (!pInstance || !pSalt || !ajaxId || !worksheetId || !reportId) return null;
  return { pInstance, pSalt, ajaxId, worksheetId, reportId };
}

async function openDsccSession(): Promise<DsccSession | null> {
  try {
    const res = await fetch(DSCC_REGISTER_URL, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const parsed = parseDsccSession(html);
    if (!parsed) return null;
    const cookie = (res.headers.getSetCookie?.() ?? [])
      .map((c) => c.split(';')[0])
      .join('; ');
    return { cookie, ...parsed };
  } catch (err) {
    console.warn('[dscc-register-lookup] session open failed:', err);
    return null;
  }
}

async function dsccPluginCall(
  session: DsccSession,
  data: Record<string, string | string[]>,
): Promise<string | null> {
  const body = new URLSearchParams();
  body.set('p_flow_id', '109');
  body.set('p_flow_step_id', '45');
  body.set('p_instance', session.pInstance);
  body.set('p_request', `PLUGIN=${session.ajaxId}`);
  body.set('pSalt', session.pSalt);
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) value.forEach((v) => body.append(key, v));
    else body.set(key, value);
  }

  try {
    const res = await fetch(DSCC_AJAX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Cookie: session.cookie,
        'X-Requested-With': 'XMLHttpRequest',
        ...FETCH_HEADERS,
      },
      body: body.toString(),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.warn('[dscc-register-lookup] plugin call failed:', err);
    return null;
  }
}

/** Download the full accredited-representative register from DSCC online. */
export async function fetchDsccRegisterFromDirectory(): Promise<DsccRegisterEntry[]> {
  const session = await openDsccSession();
  if (!session) return [];

  const res = await fetch(DSCC_REGISTER_URL, {
    headers: { ...FETCH_HEADERS, Cookie: session.cookie },
    signal: AbortSignal.timeout(20_000),
  });
  const firstHtml = res.ok ? await res.text() : '';
  const all: DsccRegisterEntry[] = parseDsccRegisterRows(firstHtml);

  let minRow = ROWS_PER_PAGE + 1;
  for (let page = 1; page < MAX_PAGES; page++) {
    const html = await dsccPluginCall(session, {
      p_widget_name: 'worksheet',
      p_widget_mod: 'ACTION',
      p_widget_action: 'PAGE',
      p_widget_action_mod: `pgR_min_row=${minRow}max_rows=${ROWS_PER_PAGE}rows_fetched=${ROWS_PER_PAGE}`,
      p_widget_num_return: String(ROWS_PER_PAGE),
      x01: session.worksheetId,
      x02: session.reportId,
    });
    if (!html) break;
    const rows = parseDsccRegisterRows(html);
    if (rows.length === 0) break;
    all.push(...rows);
    if (rows.length < ROWS_PER_PAGE) break;
    minRow += ROWS_PER_PAGE;
    // Be polite to DSCC servers.
    await new Promise((r) => setTimeout(r, 150));
  }

  return all;
}

export async function getDsccRegisterCache(): Promise<DsccRegisterCache | null> {
  if (skipKVInPrerender()) return null;
  const kv = getKV();
  if (!kv) return null;
  try {
    return await kv.get<DsccRegisterCache>(DSCC_CACHE_KEY);
  } catch (err) {
    console.warn('[dscc-register-lookup] cache read failed:', err);
    return null;
  }
}

export async function refreshDsccRegisterCache(): Promise<DsccRegisterCache | null> {
  const entries = await fetchDsccRegisterFromDirectory();
  if (entries.length === 0) return null;

  const cache: DsccRegisterCache = {
    syncedAt: new Date().toISOString(),
    count: entries.length,
    entries,
  };

  const kv = getKV();
  if (kv) {
    try {
      await kv.set(DSCC_CACHE_KEY, cache, { ex: DSCC_CACHE_TTL_SECONDS });
    } catch (err) {
      console.warn('[dscc-register-lookup] cache write failed:', err);
    }
  }

  return cache;
}

export async function ensureDsccRegisterCache(
  maxAgeMs = DSCC_CACHE_TTL_SECONDS * 1000,
): Promise<DsccRegisterCache | null> {
  const existing = await getDsccRegisterCache();
  if (existing?.entries?.length) {
    const age = Date.now() - Date.parse(existing.syncedAt);
    if (Number.isFinite(age) && age < maxAgeMs) return existing;
  }
  return refreshDsccRegisterCache();
}

function entryDisplayName(entry: DsccRegisterEntry): string {
  return `${entry.forename} ${entry.surname}`.replace(/\s+/g, ' ').trim();
}

export function findDsccRegisterMatches(
  name: string,
  entries: DsccRegisterEntry[],
): DsccRegisterEntry[] {
  const target = normalizePersonName(name);
  if (!target) return [];

  return entries.filter((entry) => {
    const display = entryDisplayName(entry);
    if (normalizePersonName(display) === target) return true;
    return namesLikelyMatch(name, display);
  });
}

export async function lookupDsccPersonByName(name: string): Promise<DsccLookupResult> {
  const cache = await ensureDsccRegisterCache();
  if (!cache) {
    return {
      found: false,
      matched: false,
      entries: [],
      cacheAgeMs: null,
      error: 'cache_unavailable',
    };
  }

  const cacheAgeMs = Date.now() - Date.parse(cache.syncedAt);
  const matches = findDsccRegisterMatches(name, cache.entries);

  return {
    found: matches.length > 0,
    matched: matches.length > 0,
    entries: matches,
    cacheAgeMs: Number.isFinite(cacheAgeMs) ? cacheAgeMs : null,
  };
}
