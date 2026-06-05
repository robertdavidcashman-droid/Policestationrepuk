/** Client-safe dialable phone check (no Node fs imports). */

export function isDialablePhone(value: string | undefined): boolean {
  const v = (value ?? '').trim();
  if (!v) return false;
  if (/not publicly|not available|does not publicly/i.test(v)) return false;
  if (v === '101' || v === '999') return true;
  return /^[\d\s+()-]{6,}$/.test(v);
}
