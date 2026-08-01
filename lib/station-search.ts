import type { PoliceStation } from '@/lib/types';
import { levenshtein } from '@/lib/rep-search';
import { isDialablePhone } from '@/lib/station-phone-dialable';
import {
  isAlwaysPublishableForceContact,
  isVerifiedStationPhoneField,
} from '@/lib/station-phone-trust';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type PhoneClass = 'station' | 'switchboard' | 'generic' | 'none';

export interface NormalizedStationQuery {
  raw: string;
  tokens: string[];
  force: string | null;
  postcode: string | null;
  isPostcodeSearch: boolean;
}

export type ScoredStation = PoliceStation & { _score: number };

/* ------------------------------------------------------------------ */
/*  Force alias map                                                    */
/* ------------------------------------------------------------------ */

const FORCE_ALIASES: Record<string, string> = {
  met: 'metropolitan police',
  'met police': 'metropolitan police',
  'the met': 'metropolitan police',
  metropolitan: 'metropolitan police',
  gmp: 'greater manchester police',
  btp: 'british transport police',
  'west mids': 'west midlands police',
  'west mid': 'west midlands police',
  'south yorks': 'south yorkshire police',
  'north yorks': 'north yorkshire police',
  'west yorks': 'west yorkshire police',
  'avon': 'avon and somerset constabulary',
  herts: 'hertfordshire constabulary',
  cambs: 'cambridgeshire constabulary',
  lancs: 'lancashire constabulary',
  notts: 'nottinghamshire police',
  staffs: 'staffordshire police',
  lincs: 'lincolnshire police',
  northants: 'northamptonshire police',
  beds: 'bedfordshire police',
  'mod police': 'ministry of defence police',
};

/* ------------------------------------------------------------------ */
/*  Switchboard / generic number sets                                  */
/*  Built from data audit: numbers shared by 3+ stations in one force  */
/* ------------------------------------------------------------------ */

const SWITCHBOARD_NUMBERS = new Set([
  '020 7230 1212',
  '0800 40 50 40',
  '0161 872 5050',
  '101',
  '01656 655555',
  '0115 967 0999',
  '0300 333 4444',
  '0116 222 2222',
  '01772 614444',
  '01782 234234',
  '01622 690690',
  '0151 709 6010',
  '01482 356413',
  '01707 354000',
  '01267 222020',
  '01522 532222',
  '0191 375 2582',
  '01202 222 222',
  '01926 415000',
  '0191 454 7555',
  '01480 456111',
  '01473 613500',
  '020 8733 3700',
  '01483 571212',
  '01962 841534',
  '01865 841 148',
  '0121 626 5000',
  '01432 347317',
  '01905 331029',
  '01785 236211',
  '0151 777 3000',
  '0161 856 5200',
  '0345 606 0365',
  '01245 491491',
  '01234 841212',
  '0300 123 1212',
  '020 8577 1212',
]);

const GENERIC_NUMBERS = new Set(['101', '0800 40 50 40']);

/* ------------------------------------------------------------------ */
/*  Phone normalisation                                                */
/*  Strip spaces/punctuation and normalise +44 / 0044 to a leading 0   */
/*  so format variants match the switchboard/generic sets.             */
/* ------------------------------------------------------------------ */

export function normalizePhone(value: string): string {
  let t = value.trim().replace(/\s+/g, '');
  if (t.startsWith('+44')) t = '0' + t.slice(3);
  else if (t.startsWith('0044')) t = '0' + t.slice(4);
  return t.replace(/\D/g, '');
}

const SWITCHBOARD_NUMBERS_NORM = new Set(
  Array.from(SWITCHBOARD_NUMBERS, normalizePhone),
);
const GENERIC_NUMBERS_NORM = new Set(Array.from(GENERIC_NUMBERS, normalizePhone));

/* ------------------------------------------------------------------ */
/*  classifyPhone                                                      */
/* ------------------------------------------------------------------ */

export function classifyPhone(station: PoliceStation): PhoneClass {
  const entries = stationPhoneNumbers(station);
  const primary =
    entries.find((e) => e.className === 'station') ??
    entries.find((e) => e.className === 'switchboard') ??
    entries[0];
  if (!primary) return 'none';
  return primary.className;
}

export function displayPhoneNumber(station: PoliceStation): string | null {
  const entries = stationPhoneNumbers(station);
  return entries.find((e) => e.verified)?.number ?? entries[0]?.number ?? null;
}

/* ------------------------------------------------------------------ */
/*  Labelled phone list — distinct numbers a caller might use          */
/* ------------------------------------------------------------------ */

export interface StationPhoneEntry {
  label: string;
  number: string;
  className: PhoneClass;
  /** True when backed by official force contact or verified provenance. */
  verified: boolean;
}

export function stationPhoneNumbers(station: PoliceStation): StationPhoneEntry[] {
  const candidates: Array<{ label: string; field: 'custodyPhone' | 'custodyPhone2' | 'phone' | 'nonEmergencyPhone'; value?: string }> = [
    { label: 'Custody desk', field: 'custodyPhone', value: station.custodyPhone },
    { label: 'Custody desk (alt)', field: 'custodyPhone2', value: station.custodyPhone2 },
    { label: 'Station main line', field: 'phone', value: station.phone },
    { label: 'Force non-emergency', field: 'nonEmergencyPhone', value: station.nonEmergencyPhone },
  ];

  const seen = new Set<string>();
  const entries: StationPhoneEntry[] = [];
  for (const { label, field, value } of candidates) {
    const trimmed = (value || '').trim();
    if (!isDialablePhone(trimmed)) continue;
    const verified = isVerifiedStationPhoneField(station, field, trimmed);
    const norm = normalizePhone(trimmed);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    let className: PhoneClass = 'station';
    if (GENERIC_NUMBERS_NORM.has(norm)) className = 'generic';
    else if (SWITCHBOARD_NUMBERS_NORM.has(norm)) className = 'switchboard';
    else if (isAlwaysPublishableForceContact(station, field, trimmed)) {
      className = GENERIC_NUMBERS_NORM.has(norm) ? 'generic' : 'switchboard';
    }
    const displayLabel =
      field === 'nonEmergencyPhone' && (norm === '101' || trimmed === '101')
        ? 'Force non-emergency (101)'
        : label;
    entries.push({ label: displayLabel, number: trimmed, className, verified });
  }
  return entries;
}

/* ------------------------------------------------------------------ */
/*  Query normalisation                                                */
/* ------------------------------------------------------------------ */

const POSTCODE_RE = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d?[A-Z]{0,2}$/i;
const POSTCODE_PREFIX_RE = /^[A-Z]{1,2}\d/i;

function stripPunctuation(s: string): string {
  return s.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
}

/** Digit-heavy query suitable for reverse phone lookup (at least 6 digits). */
export function extractPhoneQueryDigits(query: string): string | null {
  const digits = normalizePhone(query);
  if (digits.length < 6) return null;
  // Prefer queries that are mostly phone-like (avoid boosting every address with a house number).
  const nonDigit = query.replace(/\D/g, '').length;
  const digitRatio = digits.length / Math.max(1, query.replace(/\s+/g, '').length);
  if (digits.length >= 10) return digits;
  if (digitRatio >= 0.7 && digits.length >= 6) return digits;
  if (nonDigit === 0 && digits.length >= 6) return digits;
  return null;
}

function stationPhoneDigitHaystack(station: PoliceStation): string[] {
  return [station.phone, station.custodyPhone, station.custodyPhone2, station.nonEmergencyPhone]
    .map((v) => (v ? normalizePhone(v) : ''))
    .filter((d) => d.length >= 6);
}

export function normalizeStationQuery(query: string): NormalizedStationQuery {
  const raw = query.trim();
  const cleaned = stripPunctuation(raw.toLowerCase());
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  let force: string | null = null;
  let postcode: string | null = null;
  const isPostcodeSearch = POSTCODE_RE.test(raw) || POSTCODE_PREFIX_RE.test(raw);

  if (isPostcodeSearch) {
    postcode = cleaned.replace(/\s+/g, '').toUpperCase();
  }

  // Try full query as force alias
  const fullQuery = tokens.join(' ');
  if (FORCE_ALIASES[fullQuery]) {
    force = FORCE_ALIASES[fullQuery];
  } else {
    // Try individual tokens and 2-token combos
    for (let i = 0; i < tokens.length; i++) {
      if (FORCE_ALIASES[tokens[i]]) {
        force = FORCE_ALIASES[tokens[i]];
        break;
      }
      if (i + 1 < tokens.length) {
        const pair = tokens[i] + ' ' + tokens[i + 1];
        if (FORCE_ALIASES[pair]) {
          force = FORCE_ALIASES[pair];
          break;
        }
      }
    }
  }

  return { raw, tokens, force, postcode, isPostcodeSearch };
}

/* ------------------------------------------------------------------ */
/*  City → force map (cities whose name also appears in street names)  */
/* ------------------------------------------------------------------ */

const CITY_FORCES: Record<string, string[]> = {
  london: ['metropolitan police', 'city of london police', 'british transport police'],
  manchester: ['greater manchester police'],
  birmingham: ['west midlands police'],
  liverpool: ['merseyside police'],
  leeds: ['west yorkshire police'],
  bristol: ['avon and somerset constabulary'],
  sheffield: ['south yorkshire police'],
  nottingham: ['nottinghamshire police'],
  leicester: ['leicestershire police'],
  newcastle: ['northumbria police'],
};

/* ------------------------------------------------------------------ */
/*  Street-name detection                                              */
/* ------------------------------------------------------------------ */

const ROAD_SUFFIX_RE =
  /\b(road|rd|street|st|lane|ln|way|avenue|ave|drive|dr|close|cl|crescent|cres|place|pl|terrace|tc|grove|gv|mews|row|hill|gate|walk|rise|gardens|gdns|park|square|sq|bridge|broadway)\b/i;

function isStreetNameMatch(address: string, token: string): boolean {
  const lower = address.toLowerCase();
  let idx = 0;
  while ((idx = lower.indexOf(token, idx)) !== -1) {
    const afterToken = lower.substring(idx + token.length);
    const nextChunk = afterToken.trimStart().split(/[,\n]/)[0] || '';
    if (ROAD_SUFFIX_RE.test(nextChunk.split(/\s+/)[0] || '')) return true;
    const beforeToken = lower.substring(0, idx);
    const prevWord = beforeToken.trimEnd().split(/\s+/).pop() || '';
    if (/^\d+$/.test(prevWord) || /^-$/.test(prevWord)) return true;
    idx += token.length;
  }
  return false;
}

function isLocationMatch(address: string, token: string): boolean {
  if (!address.toLowerCase().includes(token)) return false;
  if (isStreetNameMatch(address, token)) return false;
  return true;
}

/* ------------------------------------------------------------------ */
/*  Scoring                                                            */
/* ------------------------------------------------------------------ */

export function scoreStation(
  station: PoliceStation,
  nq: NormalizedStationQuery,
): number {
  let score = 0;
  const name = station.name.toLowerCase();
  const address = (station.address || '').toLowerCase();
  const postcode = (station.postcode || '').toUpperCase().replace(/\s+/g, '');
  const force = (station.forceName || '').toLowerCase();
  const fullQuery = nq.tokens.join(' ');

  // Exact name match
  if (name === fullQuery || name === fullQuery + ' police station') {
    score += 100;
  } else {
    // Partial name match: any token of length >=3 found inside name
    for (const token of nq.tokens) {
      if (token.length >= 3 && name.includes(token)) {
        score += 70;
        break;
      }
    }
  }

  // Postcode match
  if (nq.postcode && postcode) {
    const queryPC = nq.postcode.replace(/\s+/g, '').toUpperCase();
    if (postcode === queryPC) {
      score += 60;
    } else if (postcode.startsWith(queryPC) || queryPC.startsWith(postcode)) {
      score += 50;
    }
  }

  // City-to-force boost: "london" → Metropolitan Police etc.
  const cityForces = CITY_FORCES[fullQuery];
  if (cityForces && cityForces.some((cf) => force.includes(cf) || cf.includes(force))) {
    score += 50;
  }

  // Force match
  if (nq.force) {
    if (force === nq.force || force.includes(nq.force) || nq.force.includes(force)) {
      score += 40;
    }
  } else if (!cityForces) {
    for (const token of nq.tokens) {
      if (token.length >= 3 && force.includes(token)) {
        score += 40;
        break;
      }
    }
  }

  // Address match — distinguish location vs street name
  for (const token of nq.tokens) {
    if (token.length >= 3 && address.includes(token)) {
      if (isLocationMatch(address, token)) {
        score += 30;
      } else {
        score += 5;
      }
      break;
    }
  }

  // Fuzzy name match (Levenshtein) — require closer match for short tokens
  if (score < 70) {
    const nameWords = name.split(/\s+/);
    for (const token of nq.tokens) {
      if (token.length >= 4) {
        const maxDist = token.length >= 6 ? 2 : 1;
        const fuzzyHit = nameWords.some(
          (w) => w.length >= 3 && levenshtein(w, token) <= maxDist,
        );
        if (fuzzyHit) {
          score += 25;
          break;
        }
      }
    }
  }

  // Reverse phone match — typed digits against published main/custody lines
  const phoneDigits = extractPhoneQueryDigits(nq.raw);
  if (phoneDigits) {
    const hay = stationPhoneDigitHaystack(station);
    if (hay.some((d) => d === phoneDigits)) {
      score += 120;
    } else if (hay.some((d) => d.includes(phoneDigits) || phoneDigits.includes(d))) {
      score += 90;
    }
  }

  // Bonus: has station-specific phone
  if (classifyPhone(station) === 'station') {
    score += 10;
  }

  // Bonus: custody suite
  if (station.isCustodyStation || station.custodySuite) {
    score += 5;
  }

  return score;
}

/* ------------------------------------------------------------------ */
/*  Main search function                                               */
/* ------------------------------------------------------------------ */

export function searchStations(
  query: string,
  stations: PoliceStation[],
): ScoredStation[] {
  const trimmed = query.trim();
  if (!trimmed) return stations.map((s) => ({ ...s, _score: 0 }));

  const nq = normalizeStationQuery(trimmed);

  const scored: ScoredStation[] = stations.map((s) => ({
    ...s,
    _score: scoreStation(s, nq),
  }));

  let results = scored.filter((s) => s._score >= 20);
  results.sort((a, b) => b._score - a._score);

  if (results.length > 0) return results;

  // Fallback 1: force-only match
  if (nq.force) {
    results = scored.filter((s) => {
      const f = (s.forceName || '').toLowerCase();
      return f === nq.force || f.includes(nq.force!) || nq.force!.includes(f);
    });
    results.sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
    if (results.length > 0) return results.map((s) => ({ ...s, _score: Math.max(s._score, 40) }));
  }

  // Fallback 2: broad substring match
  const allTokens = nq.tokens.filter((t) => t.length >= 3);
  results = scored.filter((s) => {
    const hay = [s.name, s.address, s.postcode, s.forceName, s.forceCode]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return allTokens.some((t) => hay.includes(t));
  });
  results.sort((a, b) => b._score - a._score);
  if (results.length > 0) return results.map((s) => ({ ...s, _score: Math.max(s._score, 20) }));

  // Fallback 3: return all stations alphabetically (never empty)
  scored.sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
  return scored.map((s) => ({ ...s, _score: 0 }));
}
