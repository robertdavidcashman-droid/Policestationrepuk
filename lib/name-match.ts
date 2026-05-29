/** Normalise a person name for fuzzy directory matching. */
export function normalizePersonName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split "Robert David Cashman" into searchable tokens (drops single-char middle names). */
export function nameTokens(value: string): string[] {
  return normalizePersonName(value)
    .split(' ')
    .filter((t) => t.length > 1);
}

/**
 * True when two names likely refer to the same person.
 * Requires surname match and at least one shared given-name token.
 */
export function namesLikelyMatch(a: string, b: string): boolean {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;

  const sa = ta[ta.length - 1];
  const sb = tb[tb.length - 1];
  if (sa !== sb) return false;

  const givenA = new Set(ta.slice(0, -1));
  const givenB = new Set(tb.slice(0, -1));
  for (const g of givenA) {
    if (givenB.has(g)) return true;
  }
  return false;
}
