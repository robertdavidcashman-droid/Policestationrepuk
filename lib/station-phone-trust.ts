/**
 * Which station phone fields are safe to publish as dialable facts (not guesses).
 */

import { getOfficialContact } from './official-force-contacts';
import { phonesEquivalent } from './phone-format';
import { isDialablePhone } from './station-phone-dialable';
import type { PoliceStation } from './types';
import type { StationVerificationFieldKey } from './station-verification';

export type StationPhoneField = 'phone' | 'custodyPhone' | 'custodyPhone2' | 'nonEmergencyPhone';

type VerifiedFieldKey = Extract<StationVerificationFieldKey, 'phone' | 'custodyPhone' | 'custodyPhone2'>;

const UNTRUSTED_SOURCE = /generate-data\.js|legacy custody seed/i;

function fieldMeta(station: PoliceStation, field: StationPhoneField) {
  if (field === 'nonEmergencyPhone') return undefined;
  return station.verificationMeta?.fields?.[field as VerifiedFieldKey];
}

function matchesOfficialForceNumber(station: PoliceStation, value: string): boolean {
  const official = getOfficialContact(station.forceName);
  if (!official) return false;
  if (phonesEquivalent(value, official.nonEmergency)) return true;
  if (official.switchboard && phonesEquivalent(value, official.switchboard)) return true;
  if (official.international && phonesEquivalent(value, official.international)) return true;
  return false;
}

function hasTrustedHttpSource(station: PoliceStation, field: StationPhoneField): boolean {
  const meta = fieldMeta(station, field);
  const url = meta?.sourceUrl?.trim() ?? '';
  if (!url.startsWith('http')) return false;
  if (UNTRUSTED_SOURCE.test(url)) return false;
  if (/\.police\.uk|gov\.uk|btp\.police/i.test(url)) return true;
  return false;
}

/** True when a field value may be shown as a station/custody direct line. */
export function isTrustedStationPhoneField(
  station: PoliceStation,
  field: StationPhoneField,
  value: string | undefined,
): boolean {
  const trimmed = (value ?? '').trim();
  if (!isDialablePhone(trimmed)) return false;

  const meta = fieldMeta(station, field);
  if (meta?.status === 'not_publicly_listed') return false;

  if (field === 'custodyPhone' && station.verificationMeta?.custodyContribution?.status === 'verified') {
    return true;
  }

  if (meta?.status === 'verified') {
    const notes = meta.notes ?? '';
    if (UNTRUSTED_SOURCE.test(notes) || UNTRUSTED_SOURCE.test(meta.sourceUrl ?? '')) {
      return hasTrustedHttpSource(station, field);
    }
    if (hasTrustedHttpSource(station, field)) return true;
    if (matchesOfficialForceNumber(station, trimmed)) return true;
    return false;
  }

  if (matchesOfficialForceNumber(station, trimmed)) return true;
  if (hasTrustedHttpSource(station, field)) return true;

  return false;
}

/** Non-emergency / switchboard lines we always allow (force-level, not station guesses). */
export function isAlwaysPublishableForceContact(
  station: PoliceStation,
  field: StationPhoneField,
  value: string | undefined,
): boolean {
  if (field !== 'phone' && field !== 'nonEmergencyPhone') return false;
  const trimmed = (value ?? '').trim();
  if (!isDialablePhone(trimmed)) return false;
  return matchesOfficialForceNumber(station, trimmed);
}

export function trustedPhoneValue(
  station: PoliceStation,
  field: StationPhoneField,
): string | undefined {
  const value = station[field]?.trim();
  if (!value) return undefined;
  if (isTrustedStationPhoneField(station, field, value)) return value;
  if (isAlwaysPublishableForceContact(station, field, value)) return value;
  return undefined;
}
