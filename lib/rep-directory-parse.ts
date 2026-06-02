import { formatPhoneUk, normalizePhoneDigits } from '@/lib/phone-format';

export interface ParsedRepDirectoryPhones {
  custodyPhone?: string;
  custodyPhone2?: string;
  mainPhone?: string;
  sourceUrl: string;
}

/** Extract UK phone-like tokens from a line of text. */
function extractPhonesFromLine(line: string): string[] {
  const matches = line.match(
    /(?:\+44[\s\d]{9,15}|0\d{2,4}[\s\d]{5,12}|101|0800[\s\d]{6,12})/gi,
  );
  if (!matches) return [];
  return matches.map((m) => formatPhoneUk(m.trim())).filter(Boolean);
}

/**
 * Parse policestationreps.com station page HTML for labelled phone lines.
 */
export function parseRepDirectoryStationHtml(html: string, sourceUrl: string): ParsedRepDirectoryPhones {
  const out: ParsedRepDirectoryPhones = { sourceUrl };
  const text = html
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
    const phones = extractPhonesFromLine(line);
    if (!phones.length) continue;

    if (/custody/i.test(lower) && !/see below/i.test(lower)) {
      if (!out.custodyPhone) out.custodyPhone = phones[0];
      else if (!out.custodyPhone2) out.custodyPhone2 = phones[1] ?? phones[0];
    } else if (/general|main|station/i.test(lower) && !out.mainPhone) {
      out.mainPhone = phones[0];
    }
  }

  // Fallback: table-style "Custody: 01..." in flattened text
  if (!out.custodyPhone) {
    const custodyBlock = text.match(/custody\s*:?\s*([^|]+?)(?:general|address|please|$)/i);
    if (custodyBlock) {
      const phones = extractPhonesFromLine(custodyBlock[1]);
      if (phones.length && normalizePhoneDigits(phones[0]) !== '101') {
        out.custodyPhone = phones[0];
        if (phones[1]) out.custodyPhone2 = phones[1];
      }
    }
  }

  return out;
}

/** Build policestationreps.com URL from station slug. */
export function repDirectoryUrlFromSlug(slug: string): string {
  const base = slug
    .replace(/-police-station$/i, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');
  return `https://www.policestationreps.com/Police_Stations/${base}-Police-Station.php`;
}
