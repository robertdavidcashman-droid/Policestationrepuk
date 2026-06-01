import { describe, expect, it } from 'vitest';
import { forceMatchesCounty } from '@/lib/police-force-to-counties';

describe('forceMatchesCounty', () => {
  it('maps multi-county forces to each county', () => {
    expect(forceMatchesCounty('Thames Valley Police', 'Berkshire')).toBe(true);
    expect(forceMatchesCounty('Thames Valley Police', 'Buckinghamshire')).toBe(true);
    expect(forceMatchesCounty('West Mercia Police', 'Shropshire')).toBe(true);
    expect(forceMatchesCounty('Northumbria Police', 'Tyne and Wear')).toBe(true);
  });

  it('matches a force to its own county', () => {
    expect(forceMatchesCounty('Kent Police', 'Kent')).toBe(true);
    expect(forceMatchesCounty('Metropolitan Police', 'London')).toBe(true);
  });

  it('does not match unrelated counties', () => {
    expect(forceMatchesCounty('Kent Police', 'Berkshire')).toBe(false);
    expect(forceMatchesCounty('Thames Valley Police', 'Kent')).toBe(false);
  });
});
