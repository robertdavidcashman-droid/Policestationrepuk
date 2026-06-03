/**
 * Legal Services Directory — Google indexing rules (mirrors lib/station-indexing.ts).
 *
 * Unclaimed LAA stubs are public (search, claim flow, hub pages) but not sent
 * to Google as standalone URLs until a firm claims or enriches the listing.
 */

import type { LegalDirectoryListing } from './types';
import { isUnclaimedSeededListing } from './laa-seed';

/** Individual listing profile pages Google should spend crawl budget on. */
export function shouldIndexLegalListingPage(listing: LegalDirectoryListing): boolean {
  if (listing.status !== 'approved') return false;
  if (isUnclaimedSeededListing(listing)) return false;
  return true;
}

export function shouldIncludeLegalListingInSitemap(listing: LegalDirectoryListing): boolean {
  return shouldIndexLegalListingPage(listing);
}
