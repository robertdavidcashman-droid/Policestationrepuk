import { describe, expect, it } from 'vitest';
import type { PoliceStation } from '@/lib/types';
import {
  shouldIndexPoliceStationPage,
  shouldIncludePoliceStationInSitemap,
} from '@/lib/station-indexing';

function station(overrides: Partial<PoliceStation> = {}): PoliceStation {
  return {
    id: 's1',
    slug: 'test-station',
    name: 'Test Police Station',
    ...overrides,
  } as PoliceStation;
}

describe('shouldIndexPoliceStationPage', () => {
  it('indexes stations with at least one rep', () => {
    expect(shouldIndexPoliceStationPage(station(), 1)).toBe(true);
  });

  it('indexes custody stations even with zero reps', () => {
    expect(shouldIndexPoliceStationPage(station({ isCustodyStation: true }), 0)).toBe(true);
    expect(shouldIndexPoliceStationPage(station({ custodySuite: true }), 0)).toBe(true);
  });

  it('noindexes thin stations with zero reps and no custody flag', () => {
    expect(shouldIndexPoliceStationPage(station(), 0)).toBe(false);
  });
});

describe('shouldIncludePoliceStationInSitemap', () => {
  it('matches shouldIndexPoliceStationPage', () => {
    const s = station();
    expect(shouldIncludePoliceStationInSitemap(s, 0)).toBe(
      shouldIndexPoliceStationPage(s, 0),
    );
    expect(shouldIncludePoliceStationInSitemap(s, 2)).toBe(
      shouldIndexPoliceStationPage(s, 2),
    );
  });
});
