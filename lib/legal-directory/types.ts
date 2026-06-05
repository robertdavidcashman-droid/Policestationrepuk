/**
 * Legal Services Directory — data model.
 * Stored in Upstash KV (see lib/legal-directory/storage.ts).
 */

import type { LegalDirectoryVerificationSource } from './verification-sources';

export type { LegalDirectoryVerificationSource } from './verification-sources';

export type LegalDirectoryListingStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'flagged_for_review'
  | 'pending_update'
  | 'deletion_requested'
  | 'suspended'
  | 'deleted'
  | 'rejected_spam';

export type LegalAidStatus = 'yes' | 'no' | 'not_applicable';

export type LegalDirectoryRequestType =
  | 'create'
  | 'amend'
  | 'delete'
  | 'ownership_claim';

export type LegalDirectoryRequestStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'flagged_for_review';

/** Provenance for directory-sourced contact details (separate from admin `verified` badge). */
export type LegalDirectoryVerificationStatus = 'verified' | 'unverified';

/** Public-safe listing fields (approved listings only on public routes). */
export interface LegalDirectoryListing {
  id: string;
  businessName: string;
  slug: string;
  providerType: string;
  category: string;
  categorySlug: string;
  contactPerson: string;
  email: string;
  phone: string;
  emergencyPhone: string;
  websiteUrl: string;
  addressLine1: string;
  addressLine2: string;
  town: string;
  county: string;
  postcode: string;
  region: string;
  areasCovered: string;
  policeStationsCovered: string;
  courtsCovered: string;
  description: string;
  specialisms: string;
  legalAidStatus: LegalAidStatus;
  availability24Hour: boolean;
  regulatoryBody: string;
  regulatoryNumber: string;
  accreditationDetails: string;
  logoUrl: string;
  status: LegalDirectoryListingStatus;
  featured: boolean;
  promoted: boolean;
  verified: boolean;
  /** Authoritative URL used to verify listing details. */
  sourceUrl: string;
  /** ISO date (YYYY-MM-DD) when details were last checked against sourceUrl. */
  dateVerified: string | null;
  /** Public label when contact details have not been independently verified. */
  verificationStatus: LegalDirectoryVerificationStatus;
  /**
   * Authoritative sources backing this listing's verification (Tier A/B/C).
   * `verificationStatus` should be derivable from these via
   * {@link computeListingVerification}.
   */
  verificationSources?: LegalDirectoryVerificationSource[];
  dateSubmitted: string;
  dateApproved: string | null;
  lastUpdated: string;
  deletionRequestedAt: string | null;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
  views: number;
  enquiryCount: number;
  ownerEmail: string;
  /** SHA-256 hash of management token — never store raw token. */
  managementTokenHash: string;
  managementTokenExpiresAt: string | null;
  riskScore: number;
  reviewFlags: string[];
  moderationNotes: string;
  /** Pending amendment payload — not shown publicly until approved. */
  pendingChanges: Partial<LegalDirectoryListing> | null;
  submitterIp?: string;
}

export interface LegalDirectoryListingRequest {
  id: string;
  listingId: string;
  requestType: LegalDirectoryRequestType;
  requesterName: string;
  requesterEmail: string;
  requestedChanges: Record<string, unknown>;
  status: LegalDirectoryRequestStatus;
  riskScore: number;
  reviewFlags: string[];
  moderationNotes: string;
  dateSubmitted: string;
  dateReviewed: string | null;
  reviewedBy: string | null;
  submitterIp?: string;
}

/** Fields exposed on public listing pages (no owner email, tokens, moderation). */
export type PublicLegalDirectoryListing = Omit<
  LegalDirectoryListing,
  | 'ownerEmail'
  | 'managementTokenHash'
  | 'managementTokenExpiresAt'
  | 'moderationNotes'
  | 'reviewFlags'
  | 'riskScore'
  | 'pendingChanges'
  | 'submitterIp'
> & {
  /** True for unclaimed listings seeded from published LAA data. */
  unclaimedSeeded: boolean;
};

export const PUBLIC_LISTING_STATUSES: LegalDirectoryListingStatus[] = ['approved'];
