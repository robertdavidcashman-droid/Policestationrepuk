import { describe, expect, it } from 'vitest';
import type { PoliceStation } from '@/lib/types';
import {
  buildStationContactOverview,
  buildStationContactSummary,
  computeStationHealthBadges,
} from '@/lib/station-contacts/health';

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

describe('computeStationHealthBadges', () => {
  it('flags missing custody on custody stations without published line', () => {
    const badges = computeStationHealthBadges(stub({ custodyPhone: '01634 111111' }));
    expect(badges.some((b) => b.id === 'missing-custody')).toBe(true);
  });

  it('flags open findings from context', () => {
    const badges = computeStationHealthBadges(stub(), {
      openFindingsByStationId: { 'medway-1': 2 },
    });
    expect(badges.some((b) => b.id === 'open-finding' && b.label.includes('2'))).toBe(true);
  });

  it('flags pending community updates', () => {
    const badges = computeStationHealthBadges(stub(), {
      pendingUpdateStationIds: new Set(['medway-1']),
    });
    expect(badges.some((b) => b.id === 'pending-update')).toBe(true);
  });

  it('flags stale verification older than 12 months', () => {
    const badges = computeStationHealthBadges(
      stub({
        verificationMeta: {
          dateVerified: '2020-01-01',
          fields: { phone: { status: 'verified', sourceUrl: 'https://www.kent.police.uk/' } },
        },
        phone: '01634 222222',
      }),
    );
    expect(badges.some((b) => b.id === 'stale')).toBe(true);
  });
});

describe('buildStationContactSummary', () => {
  it('derives region from county', () => {
    const summary = buildStationContactSummary(stub());
    expect(summary.region).toBe('South East');
    expect(summary.isCustody).toBe(true);
  });
});

describe('buildStationContactOverview', () => {
  it('aggregates counts from summaries', () => {
    const summaries = [
      buildStationContactSummary(stub()),
      buildStationContactSummary(
        stub({ id: '2', slug: 'other', isCustodyStation: false, name: 'Other' }),
      ),
    ];
    const overview = buildStationContactOverview(summaries, 3, 1);
    expect(overview.totalStations).toBe(2);
    expect(overview.custodyStations).toBe(1);
    expect(overview.openFindings).toBe(3);
    expect(overview.pendingCommunityUpdates).toBe(1);
  });
});
