import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_HEADLINE,
  CAMPAIGN_PATH,
  computeStationPhoneStats,
} from '@/lib/station-numbers-campaign';
import { FOOTER_DIRECTORIES, HEADER_NAV_MORE } from '@/lib/site-navigation';
import { LEGACY_EXACT_REDIRECTS } from '@/lib/legacy-exact-redirects';
import type { PoliceStation } from '@/lib/types';

const stub = (overrides: Partial<PoliceStation>): PoliceStation =>
  ({
    id: '1',
    slug: 'test',
    name: 'Test Station',
    address: '',
    county: 'Kent',
    phone: '',
    custodyPhone: '',
    ...overrides,
  }) as PoliceStation;

describe('station-numbers-campaign', () => {
  it('exports campaign constants', () => {
    expect(CAMPAIGN_HEADLINE).toBe('Help us to help you');
    expect(CAMPAIGN_PATH).toBe('/HelpUsStationNumbers');
  });

  it('computeStationPhoneStats classifies stations', () => {
    const stats = computeStationPhoneStats([
      stub({ custodyPhone: '01234 567890' }),
      stub({ phone: '101' }),
      stub({ phone: '' }),
      stub({ phone: '020 7230 1212' }),
    ]);
    expect(stats.total).toBe(4);
    expect(stats.directLine).toBe(1);
    expect(stats.generic).toBe(1);
    expect(stats.none).toBe(1);
    expect(stats.switchboard).toBe(1);
    expect(stats.needsHelp).toBe(3);
  });
});

describe('campaign navigation', () => {
  it('footer directories includes campaign link', () => {
    expect(FOOTER_DIRECTORIES.some((l) => l.href === CAMPAIGN_PATH)).toBe(true);
  });

  it('header More menu includes campaign via directories', () => {
    expect(HEADER_NAV_MORE.some((l) => l.href === CAMPAIGN_PATH)).toBe(true);
  });

  it('legacy redirect for readable slug', () => {
    expect(LEGACY_EXACT_REDIRECTS['/help-us-station-numbers']).toBe(CAMPAIGN_PATH);
  });
});
