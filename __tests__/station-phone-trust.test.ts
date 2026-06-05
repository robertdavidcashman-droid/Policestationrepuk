import { describe, expect, it } from 'vitest';
import {
  isAlwaysPublishableForceContact,
  isTrustedStationPhoneField,
  trustedPhoneValue,
} from '@/lib/station-phone-trust';
import type { PoliceStation } from '@/lib/types';

const stub = (overrides: Partial<PoliceStation>): PoliceStation =>
  ({
    id: '1',
    slug: 'test',
    name: 'Test Station',
    address: '',
    ...overrides,
  }) as PoliceStation;

describe('station-phone-trust', () => {
  it('trusts official force switchboard numbers', () => {
    const station = stub({
      forceName: 'Metropolitan Police',
      phone: '020 7230 1212',
    });
    expect(isTrustedStationPhoneField(station, 'phone', station.phone)).toBe(true);
    expect(trustedPhoneValue(station, 'phone')).toBe('020 7230 1212');
  });

  it('trusts custody lines with official police.uk provenance', () => {
    const station = stub({
      forceName: 'Devon and Cornwall Police',
      custodyPhone: '01392 290820',
      verificationMeta: {
        fields: {
          custodyPhone: {
            status: 'verified',
            sourceUrl: 'https://www.devon-cornwall.police.uk/contact/custody-information/',
            dateVerified: '2026-06-02',
          },
        },
      },
    });
    expect(isTrustedStationPhoneField(station, 'custodyPhone', station.custodyPhone)).toBe(true);
  });

  it('rejects legacy generate-data custody seeds', () => {
    const station = stub({
      forceName: 'Metropolitan Police',
      custodyPhone: '020 7240 1212',
      verificationMeta: {
        fields: {
          custodyPhone: {
            status: 'verified',
            dateVerified: '2026-06-02',
            notes: 'scripts/generate-data.js (legacy custody seed)',
          },
        },
      },
    });
    expect(isTrustedStationPhoneField(station, 'custodyPhone', station.custodyPhone)).toBe(false);
    expect(trustedPhoneValue(station, 'custodyPhone')).toBeUndefined();
  });

  it('withholds unverified station-specific main lines', () => {
    const station = stub({
      forceName: 'British Transport Police',
      phone: '0118 957 2022',
      verificationMeta: {
        fields: {
          phone: {
            status: 'unverified',
            dateVerified: '2026-06-02',
            notes: 'Existing directory number — not re-checked',
          },
        },
      },
    });
    expect(isTrustedStationPhoneField(station, 'phone', station.phone)).toBe(false);
    expect(isAlwaysPublishableForceContact(station, 'phone', station.phone)).toBe(false);
  });

  it('always publishes force non-emergency numbers', () => {
    const station = stub({
      forceName: 'Kent Police',
      nonEmergencyPhone: '101',
    });
    expect(isAlwaysPublishableForceContact(station, 'nonEmergencyPhone', '101')).toBe(true);
    expect(trustedPhoneValue(station, 'nonEmergencyPhone')).toBe('101');
  });
});
