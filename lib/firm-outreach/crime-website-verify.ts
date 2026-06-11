import { FIRM_OUTREACH_UA } from './constants';
import { CONTACT_PATHS } from './constants';

const FETCH_TIMEOUT_MS = 12_000;

/** Stricter than email-scoring keywords — avoid family-law "custody" false positives. */
const WEBSITE_CRIME_KEYWORDS = [
  'police station',
  'criminal defence',
  'criminal defense',
  'duty solicitor',
  'legal aid crime',
  'crime department',
  'criminal litigation',
  'police investigation',
  'criminal law',
] as const;

function htmlIndicatesCrimePractice(html: string): boolean {
  const blob = html.toLowerCase();
  return WEBSITE_CRIME_KEYWORDS.some((kw) => blob.includes(kw));
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': FIRM_OUTREACH_UA, Accept: 'text/html' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Best-effort check that a firm website advertises criminal / police station work. */
export async function websiteIndicatesCrimePractice(
  websiteUrl: string | undefined | null,
): Promise<boolean> {
  if (!websiteUrl?.trim()) return false;

  let base: URL;
  try {
    base = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
  } catch {
    return false;
  }

  const urls = [
    base.toString(),
    ...CONTACT_PATHS.map((p) => new URL(p, base).toString()),
    new URL('/criminal-defence', base).toString(),
    new URL('/services/criminal-defence', base).toString(),
  ];

  for (const url of urls) {
    const html = await fetchText(url);
    if (html && htmlIndicatesCrimePractice(html)) return true;
  }

  return false;
}

export { htmlIndicatesCrimePractice };
