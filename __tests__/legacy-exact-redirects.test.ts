import { describe, expect, it } from 'vitest';
import { LEGACY_EXACT_REDIRECTS } from '@/lib/legacy-exact-redirects';

describe('LEGACY_EXACT_REDIRECTS', () => {
  it('maps legacy /home and /Home (lowercase key) to homepage', () => {
    expect(LEGACY_EXACT_REDIRECTS['/home']).toBe('/');
  });

  it('maps lowercase blog hub to canonical /Blog', () => {
    expect(LEGACY_EXACT_REDIRECTS['/blog']).toBe('/Blog');
  });
});
