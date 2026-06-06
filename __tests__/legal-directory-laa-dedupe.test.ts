import { describe, it, expect } from 'vitest';
import {
  auditLaaJsonRecords,
  dedupeLaaProviderRecords,
} from '@/lib/legal-directory/laa-dedupe';
import {
  laaOfficeKey,
  laaProviderKey,
  mergeLaaProviderRecords,
  pickCanonicalLaaRecord,
  type LaaProviderRecord,
} from '@/lib/legal-directory/laa-seed';

describe('LAA office dedupe keys', () => {
  const summaryRow: LaaProviderRecord = {
    firmName: 'Boothroyds LLP',
    category: 'Crime',
    town: 'London',
    postcode: 'SE6 4QZ',
    phone: '0208 690 4848',
  };

  const crimeRow: LaaProviderRecord = {
    firmName: 'Boothroyds LLP',
    category: 'Crime',
    postcode: 'SE6 4QZ',
  };

  it('laaOfficeKey ignores town so cross-sheet rows match', () => {
    expect(laaOfficeKey(summaryRow)).toBe(laaOfficeKey(crimeRow));
  });

  it('laaProviderKey still includes town for stable listing ids', () => {
    expect(laaProviderKey(summaryRow)).not.toBe(laaProviderKey(crimeRow));
    expect(laaProviderKey(summaryRow)).toContain('london');
  });
});

describe('mergeLaaProviderRecords', () => {
  it('prefers non-empty fields from the richer row', () => {
    const merged = mergeLaaProviderRecords(
      { firmName: 'Example LLP', category: 'Crime', town: 'Leeds', phone: '0113 000 0000' },
      { firmName: 'Example LLP', category: 'Crime', postcode: 'LS1 1AA' },
    );
    expect(merged.town).toBe('Leeds');
    expect(merged.phone).toBe('0113 000 0000');
    expect(merged.postcode).toBe('LS1 1AA');
  });
});

describe('pickCanonicalLaaRecord', () => {
  it('resolves Orison LS12 3HN to Leeds', () => {
    const records: LaaProviderRecord[] = [
      {
        firmName: 'Orison Solicitors LLP',
        category: 'Crime',
        town: 'Mirfield',
        postcode: 'LS12 3HN',
      },
      {
        firmName: 'Orison Solicitors LLP',
        category: 'Crime',
        town: 'Leeds',
        postcode: 'LS12 3HN',
        phone: '0772 761 3144',
      },
    ];
    expect(pickCanonicalLaaRecord(records).town).toBe('Leeds');
  });
});

describe('dedupeLaaProviderRecords', () => {
  it('skips crime-sheet shadows when Summary row exists', () => {
    const summary: LaaProviderRecord[] = [
      {
        firmName: 'Boothroyds LLP',
        category: 'Crime',
        town: 'London',
        postcode: 'SE6 4QZ',
        phone: '0208 690 4848',
      },
    ];
    const crime: LaaProviderRecord[] = [
      { firmName: 'Boothroyds LLP', category: 'Crime', postcode: 'SE6 4QZ' },
    ];
    const { records, skippedShadows, crimeSupplements } = dedupeLaaProviderRecords(summary, crime);
    expect(records).toHaveLength(1);
    expect(records[0].town).toBe('London');
    expect(skippedShadows).toBe(1);
    expect(crimeSupplements).toBe(0);
  });

  it('keeps crime-sheet row when no Summary match', () => {
    const crime: LaaProviderRecord[] = [
      { firmName: 'Crime Only Firm', category: 'Crime', postcode: 'M1 1AA' },
    ];
    const { records, crimeSupplements, skippedShadows } = dedupeLaaProviderRecords([], crime);
    expect(records).toHaveLength(1);
    expect(records[0].firmName).toBe('Crime Only Firm');
    expect(crimeSupplements).toBe(1);
    expect(skippedShadows).toBe(0);
  });
});

describe('auditLaaJsonRecords', () => {
  it('reports zero shadow rows on deduped data', () => {
    const summary: LaaProviderRecord[] = [
      { firmName: 'A Firm', category: 'Crime', town: 'Leeds', postcode: 'LS1 1AA' },
    ];
    const { records } = dedupeLaaProviderRecords(summary, [
      { firmName: 'A Firm', category: 'Crime', postcode: 'LS1 1AA' },
    ]);
    const audit = auditLaaJsonRecords(records);
    expect(audit.shadowRows).toHaveLength(0);
    expect(audit.totalRecords).toBe(1);
    expect(audit.uniqueOffices).toBe(1);
  });
});
