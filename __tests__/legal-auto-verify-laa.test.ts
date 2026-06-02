import { describe, it, expect } from 'vitest';
import {
  detectRegulator,
  buildSraVerificationSource,
} from '@/lib/legal-directory/auto-verify';
import { computeListingVerification, tierForSource } from '@/lib/legal-directory/verification-sources';
import {
  buildLaaProviderStub,
  buildLaaVerificationSource,
  categorySlugFromLaaCategory,
  isCrimeRelatedLaaCategory,
  isUnclaimedSeededListing,
  laaProviderKey,
  LAA_DIRECTORY_URL,
  type LaaProviderRecord,
} from '@/lib/legal-directory/laa-seed';

describe('auto-verify regulator detection', () => {
  it('detects known regulators from free text', () => {
    expect(detectRegulator('SRA')).toBe('sra');
    expect(detectRegulator('Solicitors Regulation Authority')).toBe('sra');
    expect(detectRegulator('Bar Standards Board')).toBe('bsb');
    expect(detectRegulator('CILEx Regulation')).toBe('cilex');
    expect(detectRegulator('Legal Aid Agency')).toBe('laa');
  });

  it('returns null for unknown / empty bodies', () => {
    expect(detectRegulator('')).toBeNull();
    expect(detectRegulator(undefined)).toBeNull();
    expect(detectRegulator('Some Random Body')).toBeNull();
  });
});

describe('SRA verification source', () => {
  it('builds a Tier A source that verifies a listing', () => {
    const src = buildSraVerificationSource('Jane Smith', 'SRA 123456', '2026-06-02');
    expect(src.type).toBe('sra');
    expect(tierForSource(src)).toBe('A');
    expect(src.url).toContain('sraNumber=123456');
    expect(src.reference).toBe('SRA #123456');

    const v = computeListingVerification([src]);
    expect(v.status).toBe('verified');
    expect(v.dateVerified).toBe('2026-06-02');
  });
});

describe('LAA category mapping', () => {
  it('recognises crime-related categories', () => {
    expect(isCrimeRelatedLaaCategory('Crime')).toBe(true);
    expect(isCrimeRelatedLaaCategory('Prison Law')).toBe(true);
    expect(isCrimeRelatedLaaCategory('Family')).toBe(false);
    expect(isCrimeRelatedLaaCategory('Housing')).toBe(false);
  });

  it('maps categories to directory slugs', () => {
    expect(categorySlugFromLaaCategory('Prison Law')).toBe('prison-law');
    expect(categorySlugFromLaaCategory('Crime')).toBe('solicitors');
  });
});

describe('LAA provider stub building', () => {
  const record: LaaProviderRecord = {
    firmName: 'Example Defence Solicitors LLP',
    category: 'Crime',
    town: 'Manchester',
    county: 'Greater Manchester',
    postcode: 'M1 1AA',
    phone: '0161 000 0000',
    accountNumber: 'A12345',
  };

  it('produces a stable, idempotent key', () => {
    const a = laaProviderKey(record);
    const b = laaProviderKey({ ...record });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-z0-9-]+$/);
  });

  it('builds a source-verified, unclaimed, approved stub', () => {
    const stub = buildLaaProviderStub(record, { dateChecked: '2026-06-02' });
    expect(stub.id).toBe(`laa-${laaProviderKey(record)}`);
    expect(stub.businessName).toBe(record.firmName);
    expect(stub.status).toBe('approved');
    expect(stub.ownerEmail).toBe('');
    expect(stub.email).toBe('');
    expect(stub.verificationStatus).toBe('verified');
    expect(stub.dateVerified).toBe('2026-06-02');
    expect(stub.sourceUrl).toBe(LAA_DIRECTORY_URL);
    expect(stub.phone).toBe('0161 000 0000');
    expect(stub.categorySlug).toBe('solicitors');
    expect(stub.description.length).toBeGreaterThanOrEqual(80);
    expect(stub.verificationSources?.[0]?.type).toBe('laa');
    expect(isUnclaimedSeededListing(stub)).toBe(true);
  });

  it('routes prison law records to the prison-law category', () => {
    const stub = buildLaaProviderStub({ ...record, category: 'Prison Law' });
    expect(stub.categorySlug).toBe('prison-law');
  });

  it('LAA source is Tier A and includes the account reference', () => {
    const src = buildLaaVerificationSource(record, '2026-06-02');
    expect(tierForSource(src)).toBe('A');
    expect(src.reference).toContain('A12345');
  });

  it('isUnclaimedSeededListing is false once an owner is attached', () => {
    const stub = buildLaaProviderStub(record);
    expect(isUnclaimedSeededListing({ ...stub, ownerEmail: 'owner@firm.co.uk' })).toBe(false);
  });
});
