import { describe, expect, it } from 'vitest';
import type { PoliceStation } from '@/lib/types';
import {
  getCustodyPublicDisplay,
  getPublishedPhoneValue,
  isPublicContactField,
} from '@/lib/station-contacts/publish';
import { CUSTODY_NOT_PUBLISHED_TEXT } from '@/lib/station-contacts/types';

const stub = (overrides: Partial<PoliceStation> = {}): PoliceStation =>
  ({
    id: 'medway-1',
    slug: 'medway-police-station',
    name: 'Medway Police Station',
    address: '1 Example Rd',
    forceName: 'Kent Police',
    county: 'Kent',
    isCustodyStation: true,
    ...overrides,
  }) as PoliceStation;

describe('isPublicContactField', () => {
  it('hides unverified custody numbers', () => {
    const station = stub({
      custodyPhone: '01634 123456',
      verificationMeta: {
        fields: {
          custodyPhone: { status: 'unverified', sourceUrl: 'https://www.kent.police.uk/contact/' },
        },
      },
    });
    expect(isPublicContactField(station, 'custodyPhone')).toBe(false);
  });

  it('shows admin-approved discovery custody numbers', () => {
    const station = stub({
      custodyPhone: '01634 123456',
      verificationMeta: {
        custodyDiscovery: {
          status: 'verified',
          sourceFindingId: 'f1',
          approvedAt: '2026-06-01',
          approvedBy: 'admin@test.com',
          source: 'autonomous_discovery',
          sourceUrl: 'https://www.kent.police.uk/contact/',
        },
        fields: {
          custodyPhone: { status: 'verified', sourceUrl: 'https://www.kent.police.uk/contact/' },
        },
      },
    });
    expect(isPublicContactField(station, 'custodyPhone')).toBe(true);
    expect(getPublishedPhoneValue(station, 'custodyPhone')).toBe('01634 123456');
  });

  it('allows force non-emergency switchboard numbers', () => {
    const station = stub({
      phone: '101',
      forceName: 'Kent Police',
    });
    expect(isPublicContactField(station, 'phone')).toBe(true);
  });
});

describe('getCustodyPublicDisplay', () => {
  it('returns not publicly published text when no approved custody line', () => {
    const station = stub({ custodyPhone: '01634 999999' });
    const display = getCustodyPublicDisplay(station);
    expect(display.published).toBe(false);
    expect(display.message).toBe(CUSTODY_NOT_PUBLISHED_TEXT);
  });

  it('returns published number when discovery is verified', () => {
    const station = stub({
      custodyPhone: '01634 123456',
      verificationMeta: {
        custodyDiscovery: {
          status: 'verified',
          sourceFindingId: 'f1',
          approvedAt: '2026-06-01',
          approvedBy: 'admin@test.com',
          source: 'autonomous_discovery',
        },
        fields: {
          custodyPhone: { status: 'verified', sourceUrl: 'https://www.kent.police.uk/contact/' },
        },
      },
    });
    const display = getCustodyPublicDisplay(station);
    expect(display.published).toBe(true);
    expect(display.number).toBe('01634 123456');
  });
});
