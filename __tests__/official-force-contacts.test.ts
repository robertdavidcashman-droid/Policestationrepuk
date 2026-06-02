import { describe, expect, it } from 'vitest';
import { DEFAULT_NON_EMERGENCY, getOfficialContact } from '@/lib/official-force-contacts';
import { formatPhoneUk, normalizePhoneDigits, phonesEquivalent } from '@/lib/phone-format';

describe('official force contacts', () => {
  it('Kent UK non-emergency is 101 with legacy international separate', () => {
    const kent = getOfficialContact('Kent Police');
    expect(kent?.nonEmergency).toBe('101');
    expect(kent?.international).toBe('01622 690690');
  });

  it('BTP uses dedicated non-emergency line', () => {
    const btp = getOfficialContact('British Transport Police');
    expect(btp?.nonEmergency).toBe('0800 40 50 40');
  });

  it('unknown force falls back to default 101', () => {
    expect(getOfficialContact('Unknown Force')).toBeNull();
    expect(DEFAULT_NON_EMERGENCY).toBe('101');
  });
});

describe('phone format', () => {
  it('normalises +44 to UK digits', () => {
    expect(normalizePhoneDigits('+44 1622 690 690')).toBe('01622690690');
  });

  it('detects equivalent numbers', () => {
    expect(phonesEquivalent('01622 690690', '+44 1622 690 690')).toBe(true);
  });

  it('converts +44 imports without mangling existing UK spacing', () => {
    expect(formatPhoneUk('0118 957 2022')).toBe('0118 957 2022');
    expect(formatPhoneUk('+44 1223 352031')).toBe('01223 352031');
  });
});
