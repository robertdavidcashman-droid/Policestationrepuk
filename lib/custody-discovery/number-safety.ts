import { normalizePhoneDigits } from '@/lib/phone-format';

/**
 * UK number-range safety classification for the custody directory.
 *
 * A custody desk line should be a geographic (01/02), non-geographic 03,
 * or freephone number. Mobiles, premium-rate, and personal-numbering ranges
 * are never auto-approved — they are flagged for manual review.
 */

export type UkNumberRange =
  | 'geographic'
  | 'non_geographic_03'
  | 'freephone'
  | 'mobile'
  | 'premium'
  | 'emergency'
  | 'invalid';

export type NumberSafetyFlag =
  | 'mobile_number'
  | 'premium_rate'
  | 'emergency_number'
  | 'invalid_length';

export function classifyUkNumberRange(value: string): UkNumberRange {
  const digits = normalizePhoneDigits(value);
  if (!digits) return 'invalid';

  if (digits === '999' || digits === '112' || digits === '101') return 'emergency';

  // Valid UK numbers are 10 or 11 digits with leading 0.
  if (!/^0\d{9,10}$/.test(digits)) return 'invalid';

  if (digits.startsWith('07')) {
    // 070 is "personal numbering" — priced like premium rate, often abused.
    if (digits.startsWith('070')) return 'premium';
    return 'mobile';
  }
  if (digits.startsWith('09')) return 'premium';
  if (digits.startsWith('084') || digits.startsWith('087')) return 'premium';
  if (digits.startsWith('0800') || digits.startsWith('0808')) return 'freephone';
  if (digits.startsWith('03')) return 'non_geographic_03';
  if (digits.startsWith('01') || digits.startsWith('02')) return 'geographic';

  return 'invalid';
}

export function numberSafetyFlags(value: string): NumberSafetyFlag[] {
  const range = classifyUkNumberRange(value);
  switch (range) {
    case 'mobile':
      return ['mobile_number'];
    case 'premium':
      return ['premium_rate'];
    case 'emergency':
      return ['emergency_number'];
    case 'invalid':
      return ['invalid_length'];
    default:
      return [];
  }
}

/** Ranges acceptable for automatic publication as a custody desk line. */
export function isAutoPublishableRange(value: string): boolean {
  const range = classifyUkNumberRange(value);
  return range === 'geographic' || range === 'non_geographic_03' || range === 'freephone';
}

export function describeSafetyFlag(flag: NumberSafetyFlag): string {
  switch (flag) {
    case 'mobile_number':
      return 'Mobile number — verify it is an official custody line before approving';
    case 'premium_rate':
      return 'Premium-rate or personal-numbering range — do not publish';
    case 'emergency_number':
      return 'Emergency/short-code number — not a custody desk line';
    case 'invalid_length':
      return 'Not a valid UK number format';
  }
}
