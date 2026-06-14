import { describe, expect, it } from 'vitest';
import {
  buildDsccNameIndex,
  findDsccRegisterMatches,
  type DsccRegisterEntry,
} from '@/lib/dscc-register-lookup';

const SAMPLE: DsccRegisterEntry[] = [
  { title: 'Mr', forename: 'Robert', surname: 'Cashman', firm: 'Test Firm' },
  { title: 'Ms', forename: 'Jane', surname: 'Smith', firm: 'Other LLP' },
  { title: 'Mr', forename: 'Robert David', surname: 'Cashman', firm: 'Another Firm' },
  { title: 'Dr', forename: 'Alice', surname: 'Jones', firm: 'Jones & Co' },
];

describe('buildDsccNameIndex', () => {
  it('returns the same matches as a linear scan for exact names', () => {
    const index = buildDsccNameIndex(SAMPLE);
    for (const name of ['Robert Cashman', 'Jane Smith', 'Alice Jones']) {
      const linear = findDsccRegisterMatches(name, SAMPLE);
      const indexed = findDsccRegisterMatches(name, SAMPLE, { index });
      expect(indexed.map((e) => e.forename)).toEqual(linear.map((e) => e.forename));
    }
  });

  it('returns the same partial matches as a linear scan', () => {
    const index = buildDsccNameIndex(SAMPLE);
    const name = 'Robert D Cashman';
    const linear = findDsccRegisterMatches(name, SAMPLE, { allowPartial: true });
    const indexed = findDsccRegisterMatches(name, SAMPLE, { allowPartial: true, index });
    expect(indexed.length).toBeGreaterThan(0);
    expect(indexed.map((e) => `${e.forename} ${e.surname}`)).toEqual(
      linear.map((e) => `${e.forename} ${e.surname}`),
    );
  });

  it('returns empty for unknown names', () => {
    const index = buildDsccNameIndex(SAMPLE);
    expect(findDsccRegisterMatches('Nobody Here', SAMPLE, { index })).toEqual([]);
  });
});
