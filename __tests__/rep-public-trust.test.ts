import { describe, expect, it } from 'vitest';
import { isStrictDirectoryListing } from '@/lib/rep-public-trust';
import type { Representative } from '@/lib/types';

function rep(overrides: Partial<Representative> = {}): Representative {
  return {
    id: '1',
    slug: 'test-rep',
    name: 'Test Rep',
    county: 'Kent',
    accreditation: 'PSRAS',
    phone: '01234567890',
    verificationStatus: 'verified-psras',
    adminApproved: true,
    isPublic: true,
    lastVerifiedDate: new Date().toISOString().slice(0, 10),
    ...overrides,
  } as Representative;
}

describe('isStrictDirectoryListing', () => {
  it('returns true when rep passed the strict publication gate', () => {
    expect(isStrictDirectoryListing(rep())).toBe(true);
  });

  it('returns false when admin approval is missing', () => {
    expect(isStrictDirectoryListing(rep({ adminApproved: false }))).toBe(false);
  });

  it('returns false for non-verified statuses', () => {
    expect(
      isStrictDirectoryListing(rep({ verificationStatus: 'awaiting-evidence' as Representative['verificationStatus'] })),
    ).toBe(false);
  });
});
