import { describe, expect, it } from 'vitest';
import { resolveGoLink } from '@/lib/short-links';

describe('resolveGoLink', () => {
  it('resolves directory shortcuts', () => {
    expect(resolveGoLink('find')).toBe('/directory');
    expect(resolveGoLink('stations')).toBe('/StationsDirectory');
  });

  it('resolves county aliases', () => {
    expect(resolveGoLink('kent')).toBe('/directory/kent');
    expect(resolveGoLink('manchester')).toBe('/directory/greater-manchester');
  });

  it('is case-insensitive', () => {
    expect(resolveGoLink('Kent')).toBe('/directory/kent');
  });

  it('returns null for unknown keys', () => {
    expect(resolveGoLink('narnia')).toBeNull();
  });
});
