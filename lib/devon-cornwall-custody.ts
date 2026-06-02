import { formatPhoneUk, normalizePhoneDigits } from '@/lib/phone-format';

/** Force pages listing custody suite direct lines (professional / public contact area). */
export const DEVON_CORNWALL_CUSTODY_SOURCE_URLS = [
  'https://www.devon-cornwall.police.uk/contact/custody-information',
  'https://www.devon-cornwall.police.uk/contact/af/contact-us/',
  'https://www.dc.police.uk/contact/custody-information',
] as const;

export const DEVON_CORNWALL_CUSTODY_PRIMARY_SOURCE =
  DEVON_CORNWALL_CUSTODY_SOURCE_URLS[0];

export type DevonCornwallCustodyEntry = {
  custodyPhone: string;
  suiteName?: string;
  sourceUrl?: string;
};

export type DevonCornwallCustodyFile = {
  source: string;
  verifiedAt?: string;
  stations: Record<string, DevonCornwallCustodyEntry>;
};

/** Normalise location labels from the force page for slug matching. */
export function normaliseCustodyLocationLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s*police station\s*/gi, ' ')
    .replace(/\s*custody suite\s*/gi, ' ')
    .replace(/\s*&\s*/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const LOCATION_ALIASES: Record<string, string[]> = {
  exeter: ['exeter', 'heavitree', 'middlemoor'],
  plymouth: ['plymouth', 'charles cross', 'crownhill', 'devonport'],
  torquay: ['torquay'],
  barnstaple: ['barnstaple'],
  bodmin: ['bodmin'],
  camborne: ['camborne'],
  newquay: ['newquay'],
  truro: ['truro'],
  'st austell': ['st austell', 'saint austell'],
  penzance: ['penzance'],
  bideford: ['bideford'],
  tiverton: ['tiverton'],
  'newton abbot': ['newton abbot'],
  'isle of scilly': ['isle of scilly', 'isles of scilly', 'scilly'],
};

function dialableFromChunk(chunk: string): string | undefined {
  for (const m of chunk.matchAll(/(?:\+44\s?)?0\d{2,4}[\s\d]{5,12}/gi)) {
    const fmt = formatPhoneUk(m[0]);
    if (!fmt) continue;
    const digits = normalizePhoneDigits(fmt);
    if (digits === '101' || digits === '999' || digits.length < 10) continue;
    return fmt;
  }
  for (const m of chunk.matchAll(/href\s*=\s*['"]tel:([^'"]+)['"]/gi)) {
    const raw = m[1].replace(/%20/g, ' ').trim();
    if (/see below|101|999/i.test(raw)) continue;
    const fmt = formatPhoneUk(raw);
    if (fmt) return fmt;
  }
  return undefined;
}

export type ParsedDevonCornwallCustodyRow = {
  location: string;
  custodyPhone: string;
};

/**
 * Parse Devon & Cornwall Police custody information HTML.
 * Handles tables, definition lists, and "Location: number" line patterns.
 */
export function parseDevonCornwallCustodyHtml(html: string): ParsedDevonCornwallCustodyRow[] {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

  const rows: ParsedDevonCornwallCustodyRow[] = [];
  const seen = new Set<string>();

  const add = (location: string, phone: string) => {
    const loc = location.trim();
    const fmt = formatPhoneUk(phone);
    if (!loc || !fmt) return;
    const key = `${normaliseCustodyLocationLabel(loc)}|${normalizePhoneDigits(fmt)}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ location: loc, custodyPhone: fmt });
  };

  // Table rows: location cell then phone in same row
  for (const m of html.matchAll(
    /<tr[^>]*>[\s\S]*?<t[dh][^>]*>([^<]{2,80})<\/t[dh]>[\s\S]*?<t[dh][^>]*>([\s\S]*?)<\/t[dh]/gi,
  )) {
    const loc = m[1].replace(/<[^>]+>/g, ' ').trim();
    if (!/exeter|plymouth|torquay|barnstaple|bodmin|camborne|newquay|custody|suite|scilly/i.test(loc)) {
      continue;
    }
    const phone = dialableFromChunk(m[2]);
    if (phone) add(loc, phone);
  }

  // "Exeter — 01392 …" / "Plymouth (Charles Cross) 01752 …"
  for (const m of text.matchAll(
    /([A-Za-z][A-Za-z\s'&.-]{2,40}(?:Police Station|Custody Suite|Custody)?)\s*[-:–]\s*((?:\+44\s?)?0[\d\s]{9,18})/gi,
  )) {
    add(m[1], m[2]);
  }

  for (const m of text.matchAll(
    /(Exeter|Plymouth|Torquay|Barnstaple|Bodmin|Camborne|Newquay|Truro|Isles? of Scilly)[^0]{0,60}((?:\+44\s?)?0\d{2,4}[\s\d]{5,12})/gi,
  )) {
    add(m[1], m[2]);
  }

  return rows;
}

/** Map a parsed row to station slug keys used in stations.json. */
export function custodyRowToStationKeys(location: string): string[] {
  const norm = normaliseCustodyLocationLabel(location);
  const keys: string[] = [];
  for (const [canonical, aliases] of Object.entries(LOCATION_ALIASES)) {
    if (aliases.some((a) => norm.includes(a) || norm === a)) {
      keys.push(canonical);
    }
  }
  if (norm.includes('charles cross')) keys.push('plymouth-charles-cross-police-station');
  if (norm.includes('crownhill')) keys.push('sg-plymouth-crownhill');
  if (norm.includes('devonport')) keys.push('sg-plymouth-devonport');
  return keys;
}

export const SLUG_BY_CANONICAL: Record<string, string> = {
  exeter: 'exeter-police-station',
  plymouth: 'plymouth-charles-cross-police-station',
  torquay: 'torquay-police-station',
  barnstaple: 'barnstaple-police-station',
  bodmin: 'bodmin-police-station',
  camborne: 'camborne-police-station',
  newquay: 'newquay-police-station',
  truro: 'truro-police-station',
  'st austell': 'st-austell-police-station',
  penzance: 'penzance-police-station',
  bideford: 'bideford-police-station',
  tiverton: 'tiverton-police-station',
  'newton abbot': 'newton-abbot-police-station',
};

export function loadDevonCornwallCustodyFile(raw: DevonCornwallCustodyFile): DevonCornwallCustodyFile {
  return raw;
}
