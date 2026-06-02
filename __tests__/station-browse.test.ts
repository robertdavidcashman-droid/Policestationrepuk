import { describe, expect, it } from 'vitest';
import {
  buildAreaIndex,
  filterByArea,
  hasDirectNumber,
  areaKey,
} from '@/lib/station-browse';
import type { PoliceStation } from '@/lib/types';

const stub = (overrides: Partial<PoliceStation>): PoliceStation =>
  ({
    id: Math.random().toString(36).slice(2),
    slug: 'test',
    name: 'Test Station',
    address: '',
    ...overrides,
  }) as PoliceStation;

const stations: PoliceStation[] = [
  stub({ forceName: 'Kent Police', county: 'Kent', custodyPhone: '01622 690999' }),
  stub({ forceName: 'Kent Police', county: 'Kent', phone: '101' }),
  stub({ forceName: 'Thames Valley Police', county: 'Thames Valley', phone: '101' }),
  stub({ forceName: 'Metropolitan Police', county: 'London', phone: '020 7230 1212' }),
];

describe('areaKey', () => {
  it('keys by force', () => {
    expect(areaKey(stations[0], 'force')).toBe('Kent Police');
  });
  it('keys by county', () => {
    expect(areaKey(stations[3], 'county')).toBe('London');
  });
});

describe('buildAreaIndex', () => {
  it('counts stations per force, sorted', () => {
    const idx = buildAreaIndex(stations, 'force');
    expect(idx).toEqual([
      { label: 'Kent Police', count: 2 },
      { label: 'Metropolitan Police', count: 1 },
      { label: 'Thames Valley Police', count: 1 },
    ]);
  });
});

describe('filterByArea', () => {
  it('returns all stations for the "all" selection', () => {
    expect(filterByArea(stations, { type: 'all', value: '' })).toHaveLength(4);
  });
  it('filters by force', () => {
    expect(filterByArea(stations, { type: 'force', value: 'Kent Police' })).toHaveLength(2);
  });
  it('filters a single-county force', () => {
    expect(filterByArea(stations, { type: 'county', value: 'Kent' })).toHaveLength(2);
  });
  it('filters a multi-county force via the curated map', () => {
    // Thames Valley Police serves Berkshire even though its derived county label differs.
    expect(filterByArea(stations, { type: 'county', value: 'Berkshire' })).toHaveLength(1);
  });
});

describe('hasDirectNumber', () => {
  it('true for a direct station line', () => {
    expect(hasDirectNumber(stations[0])).toBe(true);
  });
  it('false for a 101 / switchboard number', () => {
    expect(hasDirectNumber(stations[1])).toBe(false);
    expect(hasDirectNumber(stations[3])).toBe(false);
  });
});
