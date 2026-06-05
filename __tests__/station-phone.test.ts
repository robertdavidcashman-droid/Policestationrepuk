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
    expect(
      classifyPhone(
        stub({
          forceName: 'Devon and Cornwall Police',
          custodyPhone: '01392 290820',
          verificationMeta: {
            fields: {
              custodyPhone: {
                status: 'verified',
                sourceUrl: 'https://www.devon-cornwall.police.uk/contact/custody-information/',
                dateVerified: '2026-06-02',
              },
            },
          },
        }),
      ),
    ).toBe('station');
  });
  it('classifies a known switchboard regardless of format', () => {
    expect(classifyPhone(stub({ forceName: 'Metropolitan Police', phone: '+44 20 7230 1212' }))).toBe(
      'switchboard',
    );
  });
  it('treats nonEmergencyPhone "101" as generic (was previously none)', () => {
    expect(
      classifyPhone(stub({ forceName: 'Kent Police', nonEmergencyPhone: '101' })),
    ).toBe('generic');
  });
  it('falls back to custodyPhone2 when other fields empty', () => {
    expect(
      classifyPhone(
        stub({
          forceName: 'Devon and Cornwall Police',
          custodyPhone2: '01392 290820',
          verificationMeta: {
            fields: {
              custodyPhone2: {
                status: 'verified',
                sourceUrl: 'https://www.devon-cornwall.police.uk/contact/custody-information/',
                dateVerified: '2026-06-02',
              },
            },
          },
        }),
      ),
    ).toBe('station');
  });
  it('returns none when no number present', () => {
    expect(classifyPhone(stub({}))).toBe('none');
  });
});

describe('stationPhoneNumbers', () => {
  const officialCustodyMeta = {
    verificationMeta: {
      fields: {
        custodyPhone: {
          status: 'verified' as const,
          sourceUrl: 'https://www.devon-cornwall.police.uk/contact/custody-information/',
          dateVerified: '2026-06-02',
        },
      },
    },
  };

  it('returns distinct labelled numbers', () => {
    const entries = stationPhoneNumbers(
      stub({
        custodyPhone: '01392 290820',
        phone: '101',
        nonEmergencyPhone: '101',
        forceName: 'Devon and Cornwall Police',
        ...officialCustodyMeta,
      }),
    );
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ label: 'Custody desk', className: 'station' });
    expect(entries[1]).toMatchObject({ label: 'Main line', className: 'generic' });
  });
  it('dedupes numbers that differ only by formatting', () => {
    const entries = stationPhoneNumbers(
      stub({
        forceName: 'Metropolitan Police',
        phone: '+44 20 7230 1212',
      }),
    );
    expect(entries).toHaveLength(1);
  });

  it('lists custody before generic non-emergency', () => {
    const entries = stationPhoneNumbers(
      stub({
        custodyPhone: '01392 290820',
        phone: '101',
        nonEmergencyPhone: '101',
        forceName: 'Devon and Cornwall Police',
        ...officialCustodyMeta,
      }),
    );
    expect(entries[0]?.label).toBe('Custody desk');
    expect(entries.some((e) => e.className === 'generic')).toBe(true);
  });

  it('returns only BTP non-emergency when that is the sole number', () => {
    const entries = stationPhoneNumbers(
      stub({
        forceName: 'British Transport Police',
        nonEmergencyPhone: '0800 40 50 40',
      }),
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ className: 'generic', number: '0800 40 50 40', verified: true });
  });

  it('includes unverified station lines with verified flag false', () => {
    const entries = stationPhoneNumbers(
      stub({
        forceName: 'British Transport Police',
        phone: '0118 957 2022',
        verificationMeta: {
          fields: {
            phone: {
              status: 'unverified',
              dateVerified: '2026-06-02',
            },
          },
        },
      }),
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      number: '0118 957 2022',
      className: 'station',
      verified: false,
    });
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
