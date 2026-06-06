import { formatPhoneUk, isPlausibleUkPhoneField, normalizePhoneDigits } from '@/lib/phone-format';
import { isGenericCustodyNumber } from './generic-numbers';

const EMERGENCY_NUMBERS = new Set(['999', '112', '911']);
const UK_PHONE_RE = /(?:\+44\s?|0)(?:\d[\s\-().]{0,3}){9,12}\d/g;

export interface ExtractedPhone {
  display: string;
  normalized: string;
  context: string;
}

/** Reject generic/switchboard/101 and emergency numbers — not direct custody desk lines. */
export function isValidCustodyCandidate(value: string, forceName?: string): boolean {
  const normalized = normalizePhoneDigits(value);
  if (!normalized) return false;
  if (EMERGENCY_NUMBERS.has(normalized)) return false;
  if (isGenericCustodyNumber(value, forceName)) return false;
  return isPlausibleUkPhoneField(value);
}

export function normalizeUkPhone(value: string, forceName?: string): string | null {
  if (!isValidCustodyCandidate(value, forceName)) return null;
  const display = formatPhoneUk(value) || value.trim();
  return display;
}

/** Extract UK phone numbers from text with surrounding context (skips 101 / switchboard). */
export function extractPhonesFromText(
  text: string,
  window = 80,
  forceName?: string,
): ExtractedPhone[] {
  if (!text?.trim()) return [];
  const results: ExtractedPhone[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(UK_PHONE_RE)) {
    const raw = match[0];
    const normalized = normalizePhoneDigits(raw);
    if (!normalized || seen.has(normalized)) continue;
    if (!isValidCustodyCandidate(raw, forceName)) continue;
    seen.add(normalized);

    const start = Math.max(0, (match.index ?? 0) - window);
    const end = Math.min(text.length, (match.index ?? 0) + raw.length + window);
    const context = text.slice(start, end).replace(/\s+/g, ' ').trim();

    const display = normalizeUkPhone(raw, forceName);
    if (!display) continue;
    results.push({ display, normalized, context });
  }
  return results;
}

/** First non-generic number in extracted list. */
export function pickCustodyCandidatePhone(
  text: string,
  forceName?: string,
): ExtractedPhone | null {
  const phones = extractPhonesFromText(text, 80, forceName);
  return phones[0] ?? null;
}

export function hasCustodyWordingNear(text: string): boolean {
  return /custody|custody suite|custody desk|detention|custody centre|custody center/i.test(text);
}

export function isCommercialUnrelatedPage(url: string, title: string): boolean {
  const hay = `${url} ${title}`.toLowerCase();
  return /amazon\.|ebay\.|booking\.com|tripadvisor|facebook\.com\/marketplace|gumtree/i.test(hay);
}
