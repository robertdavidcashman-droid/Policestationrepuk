/**
 * Normalise and format UK telephone numbers for storage and display.
 */

/** Strip to digits with leading 0 (UK) for comparison. */
export function normalizePhoneDigits(value: string): string {
  let t = value.trim().replace(/\s+/g, '');
  if (t.startsWith('+44')) t = '0' + t.slice(3);
  else if (t.startsWith('0044')) t = '0' + t.slice(4);
  return t.replace(/\D/g, '');
}

/** Convert +44 / 0044 imports to a UK display string; otherwise only trim spaces. */
export function formatPhoneUk(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  if (trimmed === '101') return '101';

  const isInternational = trimmed.startsWith('+44') || trimmed.startsWith('0044');
  if (!isInternational) return trimmed;

  const digits = normalizePhoneDigits(trimmed);
  if (!digits) return trimmed;

  if (digits.startsWith('0800') || digits.startsWith('0808')) {
    if (digits.length === 10) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
    }
    return digits;
  }

  if (digits.startsWith('02') && digits.length === 11) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }

  return trimmed;
}

export function phonesEquivalent(a: string, b: string): boolean {
  const da = normalizePhoneDigits(a);
  const db = normalizePhoneDigits(b);
  return Boolean(da && db && da === db);
}
