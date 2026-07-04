import { describe, expect, it } from 'vitest';
import { buildStationPhonePublicStats } from '@/lib/station-phone-stats-server';
import type { PoliceStation } from '@/lib/types';

function station(overrides: Partial<PoliceStation> = {}): PoliceStation {
  return {
    id: '1',
    slug: 'test-station',
    name: 'Test Station',
    address: '1 Test Road',
    ...overrides,
  } as PoliceStation;
}

describe('buildStationPhonePublicStats', () => {
  it('counts direct lines and verified custody suites', () => {
    const stats = buildStationPhonePublicStats([
      station({ phone: '01622 690690', isCustodyStation: true, custodyPhone: '01622 690691' }),
      station({ phone: '101', nonEmergencyPhone: '101' }),
      station({ isCustodyStation: true }),
    ]);

    expect(stats.total).toBe(3);
    expect(stats.directLine).toBeGreaterThanOrEqual(1);
    expect(stats.custodyStationCount).toBe(2);
  });
});

describe('StationsDirectoryExplorer card copy', () => {
  it('does not include Details unavailable in source', async () => {
    const fs = await import('node:fs/promises');
    const source = await fs.readFile('components/StationsDirectoryExplorer.tsx', 'utf-8');
    expect(source).not.toContain('Details unavailable');
  });
});
