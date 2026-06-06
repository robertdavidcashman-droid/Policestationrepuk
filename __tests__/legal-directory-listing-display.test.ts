import { describe, expect, it } from 'vitest';
import {
  SOLICITORS_CATEGORY_PATH,
} from '@/lib/legal-directory/constants';
import {
  formatLegalAidStatusLabel,
  getListingTrustBadges,
  shouldShowPublicVerifiedBadge,
} from '@/lib/legal-directory/listing-display';
import type { PublicLegalDirectoryListing } from '@/lib/legal-directory/types';

function stubListing(
  overrides: Partial<PublicLegalDirectoryListing> = {},
): PublicLegalDirectoryListing {
  return {
    id: 'test-1',
    businessName: 'Test Firm LLP',
    slug: 'test-firm',
    providerType: 'Criminal defence solicitor',
    category: 'Criminal Defence Solicitors',
    categorySlug: 'solicitors',
    contactPerson: '',
    email: '',
    phone: '',
    emergencyPhone: '',
    websiteUrl: '',
    addressLine1: '',
    addressLine2: '',
    town: 'London',
    county: 'Greater London',
    postcode: '',
    region: '',
    areasCovered: '',
    policeStationsCovered: '',
    courtsCovered: '',
    description: 'Test description.',
    specialisms: '',
    legalAidStatus: 'yes',
    availability24Hour: false,
    regulatoryBody: '',
    regulatoryNumber: '',
    accreditationDetails: '',
    logoUrl: '',
    status: 'approved',
    featured: false,
    promoted: false,
    verified: false,
    sourceUrl: 'https://www.gov.uk/guidance/find-a-legal-aid-adviser-or-family-mediator',
    dateVerified: '2026-06-01',
    verificationStatus: 'verified',
    verificationSources: [
      {
        type: 'laa',
        label: 'LAA directory',
        url: 'https://www.gov.uk/guidance/find-a-legal-aid-adviser-or-family-mediator',
        dateChecked: '2026-06-01',
      },
    ],
    dateSubmitted: '2026-06-01',
    dateApproved: '2026-06-01',
    lastUpdated: '2026-06-01',
    deletionRequestedAt: null,
    seoTitle: 'Test Firm',
    seoDescription: '',
    keywords: '',
    views: 0,
    enquiryCount: 0,
    unclaimedSeeded: true,
    ...overrides,
  };
}

describe('legal-directory listing-display', () => {
  it('exports solicitors category path for redirects', () => {
    expect(SOLICITORS_CATEGORY_PATH).toBe('/legal-services-directory/category/solicitors');
  });

  it('does not show public Verified for unclaimed LAA stubs', () => {
    const listing = stubListing({ unclaimedSeeded: true, verificationStatus: 'verified' });
    expect(shouldShowPublicVerifiedBadge(listing)).toBe(false);
    const badges = getListingTrustBadges(listing);
    expect(badges.some((b) => b.label === 'Verified')).toBe(false);
    expect(badges.some((b) => b.label.includes('Unclaimed'))).toBe(true);
    expect(badges.some((b) => b.label.includes('LAA data checked'))).toBe(true);
  });

  it('shows Verified for claimed listing with SRA source', () => {
    const listing = stubListing({
      unclaimedSeeded: false,
      verified: true,
      verificationSources: [
        {
          type: 'sra',
          label: 'SRA register',
          url: 'https://www.sra.org.uk/consumers/register/organisation/',
          dateChecked: '2026-06-01',
        },
      ],
    });
    expect(shouldShowPublicVerifiedBadge(listing)).toBe(true);
    expect(getListingTrustBadges(listing).some((b) => b.label === 'Verified')).toBe(true);
  });

  it('formats legal aid label for unclaimed LAA stubs', () => {
    expect(
      formatLegalAidStatusLabel({ unclaimedSeeded: true, legalAidStatus: 'yes' }),
    ).toBe('Crime legal aid contract (LAA published data)');
  });
});
