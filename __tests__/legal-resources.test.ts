import { describe, it, expect } from 'vitest';
import {
  getAllLegalResources,
  getLegalResourceBySlug,
  getLegalResourceSlugs,
  getLegalResourcesByGroup,
  LEGAL_RESOURCE_GROUP_ORDER,
} from '@/lib/legal-directory/resources';
import {
  computeListingVerification,
  tierForSource,
  TIER_B_THRESHOLD,
  type LegalDirectoryVerificationSource,
} from '@/lib/legal-directory/verification-sources';

describe('legal resources data', () => {
  const all = getAllLegalResources();

  it('loads a non-empty curated list', () => {
    expect(all.length).toBeGreaterThan(0);
  });

  it('has unique, url-safe slugs', () => {
    const slugs = getLegalResourceSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) {
      expect(s).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('every resource has the required fields and an https url', () => {
    for (const r of all) {
      expect(r.name).toBeTruthy();
      expect(r.shortDescription).toBeTruthy();
      expect(r.description.length).toBeGreaterThan(40);
      expect(r.url).toMatch(/^https:\/\//);
      expect(r.dateChecked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(LEGAL_RESOURCE_GROUP_ORDER).toContain(r.group);
    }
  });

  it('resolves resources by slug', () => {
    const first = all[0];
    expect(getLegalResourceBySlug(first.slug)?.url).toBe(first.url);
    expect(getLegalResourceBySlug('does-not-exist')).toBeUndefined();
  });

  it('groups in the configured display order, omitting empty groups', () => {
    const groups = getLegalResourcesByGroup();
    const order = groups.map((g) => g.group);
    const expectedOrder = LEGAL_RESOURCE_GROUP_ORDER.filter((g) =>
      all.some((r) => r.group === g),
    );
    expect(order).toEqual(expectedOrder);
    for (const g of groups) expect(g.items.length).toBeGreaterThan(0);
  });

  it('includes the CPS as an official courts/prosecution resource', () => {
    const cps = getLegalResourceBySlug('crown-prosecution-service');
    expect(cps).toBeDefined();
    expect(cps?.url).toBe('https://www.cps.gov.uk');
  });
});

function src(
  type: LegalDirectoryVerificationSource['type'],
  dateChecked = '2026-06-01',
): LegalDirectoryVerificationSource {
  return { type, label: type, url: `https://example.com/${type}`, dateChecked };
}

describe('provider verification tiering', () => {
  it('maps register sources to Tier A', () => {
    expect(tierForSource(src('sra'))).toBe('A');
    expect(tierForSource(src('laa'))).toBe('A');
  });

  it('maps corroborating sources to Tier B and weak signals to Tier C', () => {
    expect(tierForSource(src('law_society'))).toBe('B');
    expect(tierForSource(src('website'))).toBe('C');
  });

  it('is unverified with no sources', () => {
    const r = computeListingVerification([]);
    expect(r.status).toBe('unverified');
    expect(r.dateVerified).toBeNull();
    expect(r.primarySource).toBeNull();
  });

  it('a single Tier A source verifies', () => {
    const r = computeListingVerification([src('sra', '2026-05-10')]);
    expect(r.status).toBe('verified');
    expect(r.dateVerified).toBe('2026-05-10');
    expect(r.primarySource?.type).toBe('sra');
  });

  it('one Tier B source alone does not verify', () => {
    expect(computeListingVerification([src('law_society')]).status).toBe('unverified');
  });

  it('two Tier B sources verify and report the most recent date', () => {
    const r = computeListingVerification([
      src('law_society', '2026-04-01'),
      src('companies_house', '2026-05-20'),
    ]);
    expect(TIER_B_THRESHOLD).toBe(2);
    expect(r.status).toBe('verified');
    expect(r.dateVerified).toBe('2026-05-20');
    expect(r.tierBCount).toBe(2);
  });

  it('Tier C sources never verify on their own', () => {
    const r = computeListingVerification([src('website'), src('news'), src('other')]);
    expect(r.status).toBe('unverified');
  });

  it('prefers a Tier A source as primary even when Tier B is also present', () => {
    const r = computeListingVerification([
      src('law_society'),
      src('companies_house'),
      src('bsb', '2026-05-01'),
    ]);
    expect(r.status).toBe('verified');
    expect(r.primarySource?.type).toBe('bsb');
    expect(r.dateVerified).toBe('2026-05-01');
  });
});
