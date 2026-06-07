import { describe, expect, it } from 'vitest';
import {
  estimatedDriveMinutesFromHub,
  isKentBasedStation,
  isStationInCoverage,
  PSA_MAX_DRIVE_MINUTES,
} from '@/lib/policestationagent-coverage-core';
import type { PoliceStation } from '@/lib/types';

function stub(partial: Partial<PoliceStation>): PoliceStation {
  return {
    id: '1',
    slug: 'test',
    name: 'Test',
    address: '',
    ...partial,
  } as PoliceStation;
}

describe('PSA coverage drive time', () => {
  it('uses 45 minutes for non-Kent drive radius', () => {
    expect(PSA_MAX_DRIVE_MINUTES).toBe(45);
  });

  it('always includes Kent Police stations', () => {
    const maidstone = stub({
      slug: 'maidstone-police-station',
      name: 'Maidstone Police Station',
      forceName: 'Kent Police',
      latitude: 51.2721,
      longitude: 0.5284,
    });
    expect(isKentBasedStation(maidstone)).toBe(true);
    expect(isStationInCoverage(maidstone)).toBe(true);
  });

  it('includes Croydon within 45 min estimate', () => {
    const minutes = estimatedDriveMinutesFromHub(51.373264, -0.096898);
    expect(minutes).toBeLessThanOrEqual(45);
  });

  it('excludes Colchester beyond 45 min estimate', () => {
    const minutes = estimatedDriveMinutesFromHub(51.88523, 0.892097);
    expect(minutes).toBeGreaterThan(45);
  });
});
