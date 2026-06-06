import { describe, expect, it } from 'vitest';
import { LEGACY_EXACT_REDIRECTS } from '@/lib/legacy-exact-redirects';

describe('LEGACY_EXACT_REDIRECTS', () => {
  it('maps legacy /home and /Home (lowercase key) to homepage', () => {
    expect(LEGACY_EXACT_REDIRECTS['/home']).toBe('/');
  });

  it('maps lowercase blog hub to canonical /Blog', () => {
    expect(LEGACY_EXACT_REDIRECTS['/blog']).toBe('/Blog');
  });

  it('maps /firms to solicitors category (retired /Firms page)', () => {
    expect(LEGACY_EXACT_REDIRECTS['/firms']).toBe('/legal-services-directory/category/solicitors');
  });

  it('has no duplicate keys (object literal must be unique for TS build)', () => {
    const keys = Object.keys(LEGACY_EXACT_REDIRECTS);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
