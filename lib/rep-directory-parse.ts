import { formatPhoneUk, normalizePhoneDigits } from '@/lib/phone-format';

export type RepDirectoryCustodySource = 'labeled_row' | 'text_fallback';

export interface ParsedRepDirectoryPhones {
  custodyPhone?: string;
  custodyPhone2?: string;
  mainPhone?: string;
  sourceUrl: string;
  /** Where the custody number was parsed from (if any). */
  custodySource?: RepDirectoryCustodySource;
  /** Custody row is tel:See Below with no dialable number in HTML. */
  custodySeeBelow?: boolean;
}

const PSR_BASE = 'https://www.policestationreps.com/Police_Stations';

/** Known non-station numbers on PSR page footers / ads. */
const REJECTED_NORMALIZED = new Set(['101', '999', '7534533070']);

function slugToPsrSegment(slugOrName: string): string {
  return slugOrName
    .replace(/-police-station$/i, '')
    .replace(/-custody-suite$/i, '-Custody-Suite')
    .replace(/-custody$/i, '-Custody')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('-');
}

/** Build candidate policestationreps.com URLs for a station (first match wins when fetching). */
export function repDirectoryUrlCandidates(slug: string, name?: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (segment: string) => {
    const base = slugToPsrSegment(segment);
    for (const suffix of ['-Police-Station.php', '.php', '-Custody-Suite.php']) {
      const path = `${PSR_BASE}/${base}${suffix}`;
      if (!seen.has(path)) {
        seen.add(path);
        out.push(path);
      }
    }
  };

  add(slug);
  if (name) {
    add(name);
    add(name.replace(/\s*police station\s*/gi, ' ').trim());
    add(name.replace(/\s*custody suite\s*/gi, ' custody suite').trim());
  }

  return out;
}

/** @deprecated Use first candidate from {@link repDirectoryUrlCandidates}. */
export function repDirectoryUrlFromSlug(slug: string): string {
  return repDirectoryUrlCandidates(slug)[0] ?? `${PSR_BASE}/${slugToPsrSegment(slug)}-Police-Station.php`;
}

/** Exclude legacy 0845 switchboards, agency mobiles, and generic lines. */
export function isRejectedRepDirectoryPhone(
  formatted: string,
  field: 'custody' | 'main' = 'main',
): boolean {
  const digits = normalizePhoneDigits(formatted);
  if (!digits || REJECTED_NORMALIZED.has(digits)) return true;
  if (/^0845|^08452|^0870|^0871/.test(digits)) return true;
  if (field === 'custody' && /^07/.test(digits)) return true;
  return false;
}

/** Safe to import as custodyPhone from PSR — labelled custody row only. */
export function isTrustworthyPsrCustodyCandidate(parsed: ParsedRepDirectoryPhones): boolean {
  return (
    parsed.custodySource === 'labeled_row' &&
    !!parsed.custodyPhone &&
    !isRejectedRepDirectoryPhone(parsed.custodyPhone, 'custody')
  );
}

/** Strip sidebar ads / news blocks; keep station detail table only. */
export function psrStationTableHtml(html: string): string {
  const cut = html.search(/<section\s+id=['"]content['"]/i);
  const head = cut >= 0 ? html.slice(0, cut) : html;
  return head.replace(/<mat[\s\S]*?<\/mat>/gi, '');
}

function dialableTelHrefs(htmlChunk: string, field: 'custody' | 'main'): string[] {
  const out: string[] = [];
  for (const m of htmlChunk.matchAll(/href\s*=\s*['"]tel:([^'"]+)['"]/gi)) {
    const raw = m[1].replace(/%20/g, ' ').trim();
    if (!raw || /see\s*below/i.test(raw)) continue;
    const fmt = formatPhoneUk(raw);
    if (!fmt || isRejectedRepDirectoryPhone(fmt, field)) continue;
    out.push(fmt);
  }
  return out;
}

function extractRowPhones(html: string, rowId: 'tdLeft03' | 'tdLeft04'): string[] {
  const re = new RegExp(
    `${rowId}[^>]*>\\s*(?:General|Custody)\\s*:\\s*<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`,
    'i',
  );
  const m = html.match(re);
  if (!m) return [];
  const field = rowId === 'tdLeft04' ? 'custody' : 'main';
  return dialableTelHrefs(m[1], field);
}

/** Extract UK phone-like tokens from a line of text (legacy fallback). */
function extractPhonesFromLine(line: string, field: 'custody' | 'main'): string[] {
  const matches = line.match(
    /(?:\+44[\s\d]{9,15}|0\d{2,4}[\s\d]{5,12}|0800[\s\d]{6,12})/gi,
  );
  if (!matches) return [];
  return matches
    .map((m) => formatPhoneUk(m.trim()))
    .filter((fmt): fmt is string => !!fmt && !isRejectedRepDirectoryPhone(fmt, field));
}

/**
 * Parse policestationreps.com station page HTML for labelled phone lines.
 */
export function parseRepDirectoryStationHtml(html: string, sourceUrl: string): ParsedRepDirectoryPhones {
  const out: ParsedRepDirectoryPhones = { sourceUrl };
  const tableHtml = psrStationTableHtml(html);

  const generalPhones = extractRowPhones(tableHtml, 'tdLeft03');
  const custodyPhones = extractRowPhones(tableHtml, 'tdLeft04');

  if (generalPhones.length) out.mainPhone = generalPhones[0];
  if (custodyPhones.length) {
    out.custodyPhone = custodyPhones[0];
    out.custodySource = 'labeled_row';
    if (custodyPhones[1]) out.custodyPhone2 = custodyPhones[1];
  }

  out.custodySeeBelow = /tdLeft04[\s\S]{0,400}tel:\s*See\s*Below/i.test(tableHtml);

  if (!out.custodyPhone && !out.mainPhone) {
    const text = tableHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ');

    const lines = text.split(/\n|\. /).map((l) => l.trim()).filter((l) => l.length > 3);

    for (const line of lines) {
      const lower = line.toLowerCase();
      const custodyLinePhones = extractPhonesFromLine(line, 'custody');
      const mainLinePhones = extractPhonesFromLine(line, 'main');
      if (!custodyLinePhones.length && !mainLinePhones.length) continue;

      if (/custody/i.test(lower) && !/see below/i.test(lower)) {
        if (!out.custodyPhone) {
          out.custodyPhone = custodyLinePhones[0];
          out.custodySource = 'text_fallback';
        } else if (!out.custodyPhone2) {
          out.custodyPhone2 = custodyLinePhones[1] ?? custodyLinePhones[0];
        }
      } else if (/general|main|station/i.test(lower) && !out.mainPhone) {
        out.mainPhone = mainLinePhones[0];
      }
    }

    if (!out.custodyPhone) {
      const custodyBlock = text.match(/custody\s*:?\s*([^|]+?)(?:general|address|please|$)/i);
      if (custodyBlock) {
        const phones = extractPhonesFromLine(custodyBlock[1], 'custody');
        if (phones.length) {
          out.custodyPhone = phones[0];
          out.custodySource = 'text_fallback';
          if (phones[1]) out.custodyPhone2 = phones[1];
        }
      }
    }
  }

  return out;
}
