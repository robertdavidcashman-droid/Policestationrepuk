/**
 * Legal Services Directory — Google indexing rules (mirrors lib/station-indexing.ts).
 *
 * Unclaimed LAA stubs are public (search, claim flow, hub pages) but not sent
 * to Google as standalone URLs until a firm claims or enriches the listing.
 */

import type { LegalDirectoryListing } from './types';
import { isUnclaimedSeededListing } from './laa-seed';

const LAA_STUB_DESCRIPTION_MARKER =
  'This entry was created automatically from published LAA data';

/** Unclaimed LAA stub enriched beyond the auto-generated minimum (still no owner). */
export function hasLegalListingEnrichmentBeyondLaaStub(listing: LegalDirectoryListing): boolean {
  if (listing.websiteUrl?.trim()) return true;
  if (listing.specialisms?.trim()) return true;
  if (listing.areasCovered?.trim()) return true;
  if (listing.policeStationsCovered?.trim()) return true;
  if (listing.courtsCovered?.trim()) return true;
  if (listing.email?.trim()) return true;
  if (!listing.description.includes(LAA_STUB_DESCRIPTION_MARKER)) return true;
  if ((listing.verificationSources?.length ?? 0) > 1) return true;
  return false;
}

export function isEnrichedUnclaimedLegalListing(listing: LegalDirectoryListing): boolean {
  if (!isUnclaimedSeededListing(listing)) return false;
  const hasContactBasics =
    Boolean(listing.phone?.trim()) &&
    Boolean(listing.town?.trim()) &&
    Boolean(listing.postcode?.trim());
  return hasContactBasics && hasLegalListingEnrichmentBeyondLaaStub(listing);
}

/** Individual listing profile pages Google should spend crawl budget on. */
export function shouldIndexLegalListingPage(listing: LegalDirectoryListing): boolean {
  if (listing.status !== 'approved') return false;
  if (isUnclaimedSeededListing(listing)) {
    return isEnrichedUnclaimedLegalListing(listing);
  }
  return true;
}

export function shouldIncludeLegalListingInSitemap(listing: LegalDirectoryListing): boolean {
  return shouldIndexLegalListingPage(listing);
}
