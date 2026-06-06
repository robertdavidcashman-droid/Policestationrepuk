/**
 * Shared dedupe / audit helpers for LAA provider records and directory listings.
 */

import type { LegalDirectoryListing } from './types';
import {
  laaOfficeKey,
  laaRecordRichness,
  pickCanonicalLaaRecord,
  type LaaProviderRecord,
} from './laa-seed';

export interface LaaJsonAuditResult {
  totalRecords: number;
  uniqueOffices: number;
  shadowRows: LaaProviderRecord[];
  multiTownConflicts: Array<{
    officeKey: string;
    firmName: string;
    postcode: string;
    towns: string[];
    records: LaaProviderRecord[];
  }>;
  duplicateOfficeGroups: number;
}

export interface ListingOfficeRef {
  id: string;
  slug: string;
  businessName: string;
  town: string;
  postcode: string;
  officeKey: string;
  richness: number;
  ownerEmail: string;
  isLaaSeed: boolean;
}

export interface KvListingAuditResult {
  totalListings: number;
  approvedListings: number;
  userSubmitted: number;
  shadowDuplicates: Array<{
    shadow: ListingOfficeRef;
    canonical: ListingOfficeRef;
  }>;
  claimedShadows: ListingOfficeRef[];
}

export function listingOfficeKey(listing: Pick<LegalDirectoryListing, 'businessName' | 'postcode'>): string {
  return laaOfficeKey({
    firmName: listing.businessName,
    category: '',
    postcode: listing.postcode,
  });
}

function listingRichness(listing: LegalDirectoryListing): number {
  let score = 0;
  if (listing.town?.trim()) score += 4;
  if (listing.county?.trim()) score += 2;
  if (listing.phone?.trim()) score += 1;
  if (listing.websiteUrl?.trim()) score += 1;
  if (listing.ownerEmail?.trim()) score += 8;
  return score;
}

export function toListingOfficeRef(listing: LegalDirectoryListing): ListingOfficeRef {
  return {
    id: listing.id,
    slug: listing.slug,
    businessName: listing.businessName,
    town: listing.town ?? '',
    postcode: listing.postcode ?? '',
    officeKey: listingOfficeKey(listing),
    richness: listingRichness(listing),
    ownerEmail: listing.ownerEmail ?? '',
    isLaaSeed: listing.id.startsWith('laa-'),
  };
}

/** Audit static LAA JSON for shadow rows and multi-town conflicts. */
export function auditLaaJsonRecords(records: LaaProviderRecord[]): LaaJsonAuditResult {
  const byOffice = new Map<string, LaaProviderRecord[]>();
  for (const record of records) {
    const key = laaOfficeKey(record);
    const group = byOffice.get(key) ?? [];
    group.push(record);
    byOffice.set(key, group);
  }

  const shadowRows: LaaProviderRecord[] = [];
  const multiTownConflicts: LaaJsonAuditResult['multiTownConflicts'] = [];

  for (const [officeKey, group] of byOffice) {
    if (group.length < 2) continue;

    const withTown = group.filter((r) => r.town?.trim());
    const withoutTown = group.filter((r) => !r.town?.trim());
    shadowRows.push(...withoutTown);

    const towns = [...new Set(withTown.map((r) => r.town!.trim()))];
    if (towns.length > 1) {
      multiTownConflicts.push({
        officeKey,
        firmName: group[0].firmName,
        postcode: group[0].postcode ?? '',
        towns,
        records: group,
      });
    }
  }

  return {
    totalRecords: records.length,
    uniqueOffices: byOffice.size,
    shadowRows,
    multiTownConflicts,
    duplicateOfficeGroups: [...byOffice.values()].filter((g) => g.length > 1).length,
  };
}

/** Audit KV listings for shadow duplicates (empty town + richer twin). */
export function auditKvListings(listings: LegalDirectoryListing[]): KvListingAuditResult {
  const approved = listings.filter((l) => l.status === 'approved');
  const refs = approved.map(toListingOfficeRef);
  const byOffice = new Map<string, ListingOfficeRef[]>();
  for (const ref of refs) {
    const group = byOffice.get(ref.officeKey) ?? [];
    group.push(ref);
    byOffice.set(ref.officeKey, group);
  }

  const shadowDuplicates: KvListingAuditResult['shadowDuplicates'] = [];
  const claimedShadows: ListingOfficeRef[] = [];

  for (const group of byOffice.values()) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => b.richness - a.richness);
    const canonical = sorted[0];
    for (const candidate of sorted.slice(1)) {
      const isShadow = !candidate.town.trim() && Boolean(canonical.town.trim());
      if (!isShadow) continue;
      if (candidate.ownerEmail) {
        claimedShadows.push(candidate);
        continue;
      }
      shadowDuplicates.push({ shadow: candidate, canonical });
    }
  }

  return {
    totalListings: listings.length,
    approvedListings: approved.length,
    userSubmitted: approved.filter((l) => !l.id.startsWith('laa-')).length,
    shadowDuplicates,
    claimedShadows,
  };
}

/** Dedupe LAA records for fetch output (Summary first, Crime sheet supplements only). */
export function dedupeLaaProviderRecords(
  summaryRows: LaaProviderRecord[],
  crimeRows: LaaProviderRecord[],
): {
  records: LaaProviderRecord[];
  summaryOnly: number;
  crimeSupplements: number;
  skippedShadows: number;
  resolvedConflicts: number;
} {
  const offices = new Map<string, LaaProviderRecord[]>();

  for (const row of summaryRows) {
    const key = laaOfficeKey(row);
    const group = offices.get(key) ?? [];
    group.push(row);
    offices.set(key, group);
  }

  let resolvedConflicts = 0;
  for (const [key, group] of offices) {
    if (group.length === 1) continue;
    const canonical = pickCanonicalFromGroup(group);
    if (group.length > 1) resolvedConflicts += group.length - 1;
    offices.set(key, [canonical]);
  }

  let summaryOnly = 0;
  for (const record of offices.values()) {
    summaryOnly += record.length;
  }

  let crimeSupplements = 0;
  let skippedShadows = 0;

  for (const row of crimeRows) {
    const key = laaOfficeKey(row);
    const existing = offices.get(key);
    if (existing) {
      skippedShadows++;
      continue;
    }
    offices.set(key, [row]);
    crimeSupplements++;
  }

  const records = [...offices.values()].map((g) => g[0]);
  return { records, summaryOnly, crimeSupplements, skippedShadows, resolvedConflicts };
}

function pickCanonicalFromGroup(group: LaaProviderRecord[]): LaaProviderRecord {
  const towns = [...new Set(group.map((r) => r.town?.trim()).filter(Boolean))];
  if (towns.length <= 1) {
    return group.reduce((best, cur) =>
      laaRecordRichness(cur) >= laaRecordRichness(best) ? cur : best,
    );
  }
  return pickCanonicalLaaRecord(group);
}
