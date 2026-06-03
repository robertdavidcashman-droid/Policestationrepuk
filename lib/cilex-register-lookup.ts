/**
 * CILEx Regulation — best-effort lookup by membership number and name.
 * Uses the public CILEX site search; no official API.
 */
import { namesLikelyMatch } from '@/lib/name-match';

const FETCH_HEADERS = {
  'User-Agent': 'PoliceStationRepUK/1.0 (+https://policestationrepuk.org)',
  Accept: 'text/html',
} as const;

export interface CilexLookupResult {
  found: boolean;
  matched: boolean;
  memberNumber: string;
  error?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** CILEx membership numbers are typically 5–8 digits. */
export function isPlausibleCilexMemberNumber(raw: string): boolean {
  const n = raw.replace(/\D/g, '');
  return n.length >= 5 && n.length <= 8;
}

export async function lookupCilexMember(input: {
  memberNumber: string;
  name?: string;
}): Promise<CilexLookupResult> {
  const memberNumber = input.memberNumber.replace(/\D/g, '');
  if (!isPlausibleCilexMemberNumber(memberNumber)) {
    return { found: false, matched: false, memberNumber, error: 'invalid_member_number' };
  }

  try {
    const q = encodeURIComponent(memberNumber);
    const res = await fetch(`https://www.cilex.org.uk/?s=${q}`, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return { found: false, matched: false, memberNumber, error: `fetch_failed_${res.status}` };
    }
    const text = stripHtml(await res.text());
    if (!text.includes(memberNumber)) {
      return { found: false, matched: false, memberNumber };
    }

    const nameOk =
      !input.name?.trim() ||
      namesLikelyMatch(input.name, text) ||
      text.toLowerCase().includes(input.name.trim().toLowerCase());

    return { found: true, matched: nameOk, memberNumber };
  } catch (err) {
    return {
      found: false,
      matched: false,
      memberNumber,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
