import { describe, it, expect } from 'vitest';
import { getCategoryCardCountLabel } from '@/lib/legal-directory/category-display';
import {
  PSR_LEGAL_DIRECTORY_CATEGORY_SLUG,
  REP_DIRECTORY_LINKS,
} from '@/lib/legal-directory/constants';
import { getCategoryHubBody } from '@/lib/legal-directory/hub-copy';
import { getCategoryBySlug } from '@/lib/legal-directory/categories';

describe('PSR legal directory cross-link helpers', () => {
  it('defines stable rep directory link paths', () => {
    expect(REP_DIRECTORY_LINKS.find).toBe('/directory');
    expect(REP_DIRECTORY_LINKS.register).toBe('/register');
    expect(REP_DIRECTORY_LINKS.nationalLanding).toBe(
      '/police-station-representatives-directory-england-wales',
    );
  });

  it('uses a dedicated PSR category slug constant', () => {
    expect(PSR_LEGAL_DIRECTORY_CATEGORY_SLUG).toBe('police-station-representatives');
  });
});

describe('getCategoryCardCountLabel', () => {
  it('shows rep directory signpost for empty PSR category', () => {
    expect(getCategoryCardCountLabel('police-station-representatives', 0)).toBe(
      '180+ reps in main directory →',
    );
  });

  it('shows generic empty label for other zero-count categories', () => {
    expect(getCategoryCardCountLabel('barristers', 0)).toBe('No approved listings yet');
  });

  it('shows provider count when listings exist', () => {
    expect(getCategoryCardCountLabel('solicitors', 1)).toBe('1 provider');
    expect(getCategoryCardCountLabel('solicitors', 42)).toBe('42 providers');
  });
});

describe('PSR category hub copy', () => {
  it('mentions the main rep directory', () => {
    const cat = getCategoryBySlug('police-station-representatives');
    expect(cat).toBeDefined();
    const body = getCategoryHubBody(cat!);
    expect(body.toLowerCase()).toContain('main');
    expect(body).toContain('/directory');
  });
});
