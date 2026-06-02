import { describe, expect, it } from 'vitest';
import {
  isCustodyStation,
  nameMatchesSeed,
  normaliseStationName,
  slugMatchesSeed,
} from '@/lib/custody-station';
import type { PoliceStation } from '@/lib/types';

const stub = (overrides: Partial<PoliceStation>): PoliceStation =>
  ({
    id: '1',
    slug: 'medway-police-station',
    name: 'Medway Police Station',
    address: '',
    ...overrides,
  }) as PoliceStation;

describe('isCustodyStation', () => {
  it('returns true when isCustodyStation flag is set', () => {
    expect(isCustodyStation(stub({ isCustodyStation: true }))).toBe(true);
  });

  it('returns true when legacy custodySuite flag is set', () => {
    expect(isCustodyStation(stub({ custodySuite: true }))).toBe(true);
  });

  it('matches custody in station name', () => {
    expect(isCustodyStation(stub({ name: 'Maidstone Custody Suite' }))).toBe(true);
  });

  it('returns false for ordinary station names', () => {
    expect(isCustodyStation(stub({ name: 'Tonbridge Police Station' }))).toBe(false);
  });
});

describe('normaliseStationName', () => {
  it('strips police station suffix and punctuation', () => {
    expect(normaliseStationName('Medway Police Station')).toBe('medway');
  });
});

describe('slugMatchesSeed', () => {
  it('matches seed slug as prefix of station slug', () => {
    expect(slugMatchesSeed('medway', 'medway-police-station')).toBe(true);
  });

  it('rejects unrelated slugs', () => {
    expect(slugMatchesSeed('medway', 'maidstone-police-station')).toBe(false);
  });
});

describe('nameMatchesSeed', () => {
  it('matches normalised names', () => {
    expect(nameMatchesSeed('Medway', 'Medway Police Station')).toBe(true);
  });
});
