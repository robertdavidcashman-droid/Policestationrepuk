import { formatPhoneUk, isPlausibleUkPhoneField, normalizePhoneDigits } from '@/lib/phone-format';
import { isRejectedRepDirectoryPhone } from '@/lib/rep-directory-parse';

export interface ValidatedCustodyNumber {
  ok: boolean;
  number?: string;
  digits?: string;
  error?: string;
}

/**
 * Validate a rep-submitted custody desk number.
 *
 * Rejects prose, 101/999, mobiles, 0845/0870 switchboards and the known agency
 * line (via {@link isRejectedRepDirectoryPhone}). Custody desks are geographic
 * landlines, so a plausible UK landline is required.
 */
export function validateCustodyNumber(raw: string): ValidatedCustodyNumber {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return { ok: false, error: 'Enter a custody desk number.' };

  if (!isPlausibleUkPhoneField(trimmed)) {
    return { ok: false, error: 'That does not look like a UK phone number.' };
  }

  const number = formatPhoneUk(trimmed);
  const digits = normalizePhoneDigits(number);

  if (digits === '101' || digits === '999') {
    return { ok: false, error: 'Enter the direct custody desk line, not 101 or 999.' };
  }
  if (/^07/.test(digits)) {
    return { ok: false, error: 'Custody desks are landlines — mobile numbers are not accepted.' };
  }
  if (isRejectedRepDirectoryPhone(number, 'custody')) {
    return { ok: false, error: 'That number is a switchboard or agency line, not a custody desk.' };
  }
  if (!/^0\d{9,10}$/.test(digits)) {
    return { ok: false, error: 'Enter a full UK landline number including the area code.' };
  }

  return { ok: true, number, digits };
}
