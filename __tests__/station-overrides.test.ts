import { describe, expect, it } from 'vitest';
import { applyStationOverride, type StationOverride } from '@/lib/station-overrides';
import type { PoliceStation } from '@/lib/types';

const base: PoliceStation = {
  id: 'PE1',
  slug: 'test-police-station',
  name: 'Test Police Station',
  address: 'Old Address',
  postcode: 'AA1 1AA',
  phone: '101',
} as PoliceStation;

const override = (fields: StationOverride['fields']): StationOverride => ({
  stationId: 'PE1',
  fields,
  updatedAt: new Date().toISOString(),
});

describe('applyStationOverride', () => {
  it('returns the station unchanged when no override', () => {
    expect(applyStationOverride(base, undefined)).toBe(base);
  });

  it('overrides only the provided fields', () => {
    const merged = applyStationOverride(base, override({ custodyPhone: '01622 690999' }));
    expect(merged.custodyPhone).toBe('01622 690999');
    expect(merged.address).toBe('Old Address');
    expect(merged.phone).toBe('101');
  });

  it('overrides address and postcode together', () => {
    const merged = applyStationOverride(
      base,
      override({ address: 'New Address', postcode: 'BB2 2BB' }),
    );
    expect(merged.address).toBe('New Address');
    expect(merged.postcode).toBe('BB2 2BB');
  });

  it('does not mutate the original station', () => {
    applyStationOverride(base, override({ address: 'Mutated?' }));
    expect(base.address).toBe('Old Address');
  });
});
