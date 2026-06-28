/**
 * Google Business Profile (via Buffer) rejects post bodies that contain phone numbers.
 * The learn_more CTA link is set in post metadata — dialable numbers must be stripped from text.
 */

/** UK and +44 formats — aligned with custody-discovery extraction. */
const UK_PHONE_RE = /(?:\+44\s?|0)(?:\d[\s\-().]{0,3}){9,12}\d/g;

const PAREN_STYLE_PHONE_RE = /\(\s*0?\d{2,5}\s*\)[\s\-]*\d[\d\s\-]{5,}/g;

export function containsGoogleBusinessPhoneNumber(text: string): boolean {
  UK_PHONE_RE.lastIndex = 0;
  if (UK_PHONE_RE.test(text)) return true;
  return PAREN_STYLE_PHONE_RE.test(text);
}

export function sanitizeGoogleBusinessPostText(text: string): string {
  let result = text.replace(PAREN_STYLE_PHONE_RE, '').replace(UK_PHONE_RE, '');

  result = result
    .replace(/\(\s*(?=[,.;:!?\s]|$)/g, '')
    .replace(/\s+\)/g, '')
    .split('\n')
    .map((line) => line.replace(/\s{2,}/g, ' ').replace(/\s+([,.;:])/g, '$1').trim())
    .filter((line) => line.length > 0)
    .join('\n');

  return result.trim();
}
