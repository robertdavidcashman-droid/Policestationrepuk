import { describe, expect, it } from 'vitest';
import { buildStationPhoneReportUrl } from '@/lib/station-phone-report';
import { extractPhoneQueryDigits, searchStations } from '@/lib/station-search';
import type { PoliceStation } from '@/lib/types';

const stub = (overrides: Partial<PoliceStation>): PoliceStation =>
  ({
    id: 'st-1',
    slug: 'maidstone',
    name: 'Maidstone Police Station',
    address: 'Palace Avenue',
    forceName: 'Kent Police',
    ...overrides,
  }) as PoliceStation;

describe('buildStationPhoneReportUrl', () => {
  it('prefills station, reason, field, number and notes', () => {
    const href = buildStationPhoneReportUrl({
      stationId: 'st-1',
      number: '01622 690690',
      field: 'custodyPhone',
      reason: 'not_custody_desk',
    });
    expect(href.startsWith('/UpdateStation?')).toBe(true);
    expect(href).toContain('station=st-1');
    expect(href).toContain('reason=not_custody_desk');
    expect(href).toContain('field=custodyPhone');
    expect(href).toContain('number=01622');
    expect(href).toContain('notes=');
  });
});

describe('reverse phone search', () => {
  it('extracts digit-heavy phone queries', () => {
    expect(extractPhoneQueryDigits('01622 690690')).toBe('01622690690');
    expect(extractPhoneQueryDigits('Maidstone')).toBeNull();
  });

  it('ranks stations matching a typed phone number first', () => {
    const stations = [
      stub({ id: 'a', slug: 'a', name: 'Alpha', phone: '01234 567890' }),
      stub({
        id: 'b',
        slug: 'b',
        name: 'Beta Custody',
        custodyPhone: '01622 690690',
        isCustodyStation: true,
      }),
    ];
    const results = searchStations('01622 690690', stations);
    expect(results[0]?.id).toBe('b');
    expect(results[0]?._score).toBeGreaterThanOrEqual(90);
  });
});
