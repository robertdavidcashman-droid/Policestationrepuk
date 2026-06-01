import { describe, expect, it } from 'vitest';
import {
  classifyPhone,
  normalizePhone,
  stationPhoneNumbers,
} from '@/lib/station-search';
import { deriveStationCounty, withDerivedCounty } from '@/lib/force-county';
import type { PoliceStation } from '@/lib/types';

const stub = (overrides: Partial<PoliceStation>): PoliceStation =>
  ({
    id: '1',
    slug: 'test',
    name: 'Test Station',
    address: '',
    ...overrides,
  }) as PoliceStation;

describe('normalizePhone', () => {
  it('strips spaces and punctuation', () => {
    expect(normalizePhone('020 7230 1212')).toBe('02072301212');
  });
  it('normalises +44 to leading 0', () => {
    expect(normalizePhone('+44 800 405040')).toBe('0800405040');
  });
  it('normalises 0044 to leading 0', () => {
    expect(normalizePhone('0044 161 872 5050')).toBe('01618725050');
  });
});

describe('classifyPhone', () => {
  it('classifies a direct station line', () => {
    expect(classifyPhone(stub({ custodyPhone: '01622 690999' }))).toBe('station');
  });
  it('classifies a known switchboard regardless of format', () => {
    expect(classifyPhone(stub({ phone: '+44 20 7230 1212' }))).toBe('switchboard');
  });
  it('treats nonEmergencyPhone "101" as generic (was previously none)', () => {
    expect(classifyPhone(stub({ nonEmergencyPhone: '101' }))).toBe('generic');
  });
  it('falls back to custodyPhone2 when other fields empty', () => {
    expect(classifyPhone(stub({ custodyPhone2: '01865 000000' }))).toBe('station');
  });
  it('returns none when no number present', () => {
    expect(classifyPhone(stub({}))).toBe('none');
  });
});

describe('stationPhoneNumbers', () => {
  it('returns distinct labelled numbers', () => {
    const entries = stationPhoneNumbers(
      stub({ custodyPhone: '01622 690999', phone: '101', nonEmergencyPhone: '101' }),
    );
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ label: 'Custody desk', className: 'station' });
    expect(entries[1]).toMatchObject({ label: 'Main line', className: 'generic' });
  });
  it('dedupes numbers that differ only by formatting', () => {
    const entries = stationPhoneNumbers(
      stub({ custodyPhone: '020 7230 1212', phone: '+44 20 7230 1212' }),
    );
    expect(entries).toHaveLength(1);
  });
});

describe('deriveStationCounty', () => {
  it('keeps an existing county', () => {
    expect(deriveStationCounty(stub({ county: 'Kent' }))).toBe('Kent');
  });
  it('maps Metropolitan Police to London', () => {
    expect(deriveStationCounty(stub({ forceName: 'Metropolitan Police' }))).toBe('London');
  });
  it('strips the force suffix as a fallback', () => {
    expect(deriveStationCounty(stub({ forceName: 'Madeup Constabulary' }))).toBe('Madeup');
  });
  it('falls back to Other with no force', () => {
    expect(deriveStationCounty(stub({}))).toBe('Other');
  });
  it('withDerivedCounty populates the field', () => {
    expect(withDerivedCounty(stub({ forceName: 'Kent Police' })).county).toBe('Kent');
  });
});
