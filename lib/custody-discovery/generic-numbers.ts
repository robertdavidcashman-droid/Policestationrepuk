import { normalizePhoneDigits } from '@/lib/phone-format';
import { getOfficialContact } from '@/lib/official-force-contacts';

/** Non–custody-desk lines we never store as findings. */
const GENERIC_NORMALIZED = new Set([
  '101',
  '0800405040', // BTP / generic non-emergency
  '03001231212',
]);

const SWITCHBOARD_NORMALIZED = new Set([
  '02072301212',
  '01618725050',
  '01656655555',
  '03003334444',
  '01162222222',
  '01772614444',
  '01782234234',
  '01622690690',
  '01517096010',
  '01482356413',
  '01707354000',
  '01267222020',
  '01522532222',
  '01913752582',
  '01202222222',
  '01926415000',
  '01914547555',
  '01480456111',
  '01473613500',
  '02087333700',
  '01483571212',
  '01962841534',
  '01865841148',
  '01216265000',
  '01432347317',
  '01905331029',
  '01785236211',
  '01517773000',
  '01618565200',
  '03456060365',
  '01245491491',
  '01234841212',
  '02085771212',
  '01159670999',
]);

export function isGenericCustodyNumber(value: string, forceName?: string): boolean {
  const normalized = normalizePhoneDigits(value);
  if (!normalized) return true;
  if (GENERIC_NORMALIZED.has(normalized)) return true;
  if (SWITCHBOARD_NORMALIZED.has(normalized)) return true;

  if (forceName) {
    const official = getOfficialContact(forceName);
    if (official) {
      const candidates = [
        official.nonEmergency,
        official.switchboard,
        official.international,
      ].filter(Boolean) as string[];
      for (const c of candidates) {
        if (normalizePhoneDigits(c) === normalized) return true;
      }
    }
  }

  return false;
}
