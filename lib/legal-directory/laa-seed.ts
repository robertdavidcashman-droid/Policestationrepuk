/**
 * Legal Services Directory — seed unclaimed provider stubs from published
 * Legal Aid Agency (LAA) "Directory of legal aid providers" data.
 *
 * Stubs are source-verified (Tier A: published LAA data) but unclaimed: they
 * carry no owner email or contact person until a firm claims the listing via the
 * ownership-claim flow. The pure builders here are unit-tested; the fetch/seed
 * scripts are thin wrappers around them.
 */

import { getCategoryBySlug } from './categories';
import {
  buildListingSlug,
  slugifyLegalDirectory,
} from './slug';
import { buildSeoTitle } from './slug';
import { computeListingVerification, type LegalDirectoryVerificationSource } from './verification-sources';
import type { LegalDirectoryListing } from './types';

/** Source publication for the seeded data. */
export const LAA_DIRECTORY_URL =
  'https://www.gov.uk/government/publications/directory-of-legal-aid-providers';

/** A single firm row distilled from the LAA directory spreadsheet. */
export interface LaaProviderRecord {
  firmName: string;
  /** LAA category of law, e.g. "Crime" or "Prison Law". */
  category: string;
  town?: string;
  county?: string;
  postcode?: string;
  phone?: string;
  /** LAA account number, when present. */
  accountNumber?: string;
}

/** LAA categories we import into the criminal-justice directory. */
const LAA_CRIME_CATEGORIES = ['crime', 'prison law'];

export function isCrimeRelatedLaaCategory(category: string): boolean {
  const c = category.trim().toLowerCase();
  return LAA_CRIME_CATEGORIES.some((k) => c.includes(k));
}

/** Map an LAA category of law to one of our directory category slugs. */
export function categorySlugFromLaaCategory(category: string): string {
  const c = category.trim().toLowerCase();
  if (c.includes('prison')) return 'prison-law';
  return 'solicitors';
}

/** Stable key (and slug/id basis) for a provider, so re-runs are idempotent. */
export function laaProviderKey(record: LaaProviderRecord): string {
  const parts = [record.firmName, record.town, record.postcode]
    .map((p) => slugifyLegalDirectory(p ?? ''))
    .filter(Boolean);
  return parts.join('-').slice(0, 120) || 'laa-provider';
}

/** Normalised office key for cross-sheet dedupe (firm + postcode; town excluded). */
export function laaOfficeKey(record: LaaProviderRecord): string {
  const parts = [record.firmName, record.postcode]
    .map((p) => slugifyLegalDirectory(p ?? ''))
    .filter(Boolean);
  return parts.join('-').slice(0, 120) || 'laa-office';
}

/** Richness score for choosing the canonical row when merging duplicates. */
export function laaRecordRichness(record: LaaProviderRecord): number {
  let score = 0;
  if (record.town?.trim()) score += 4;
  if (record.county?.trim()) score += 2;
  if (record.phone?.trim()) score += 1;
  if (record.accountNumber?.trim()) score += 1;
  return score;
}

/**
 * When the LAA Summary sheet lists conflicting towns for the same firm + postcode,
 * keep the canonical town (verified against postcode geography).
 */
export const LAA_MULTI_TOWN_RESOLUTIONS: Record<string, string> = {
  'orison-solicitors-llp-ls12-3hn': 'Leeds',
};

/** Merge two LAA rows for the same office; never overwrite non-empty with empty. */
export function mergeLaaProviderRecords(
  a: LaaProviderRecord,
  b: LaaProviderRecord,
): LaaProviderRecord {
  const pick = (x?: string, y?: string) => (x?.trim() ? x : y?.trim() ? y : undefined);
  return {
    firmName: a.firmName || b.firmName,
    category: a.category || b.category,
    town: pick(a.town, b.town),
    county: pick(a.county, b.county),
    postcode: pick(a.postcode, b.postcode),
    phone: pick(a.phone, b.phone),
    accountNumber: pick(a.accountNumber, b.accountNumber),
  };
}

/** Pick the canonical Summary row when multiple rows share an office key. */
export function pickCanonicalLaaRecord(records: LaaProviderRecord[]): LaaProviderRecord {
  if (records.length === 1) return records[0];
  const officeKey = laaOfficeKey(records[0]);
  const preferredTown = LAA_MULTI_TOWN_RESOLUTIONS[officeKey];
  if (preferredTown) {
    const match = records.find((r) => r.town?.trim().toLowerCase() === preferredTown.toLowerCase());
    if (match) return match;
  }
  return records.reduce((best, cur) =>
    laaRecordRichness(cur) > laaRecordRichness(best) ? cur : best,
  );
}

export function buildLaaVerificationSource(
  record: LaaProviderRecord,
  dateChecked: string,
): LegalDirectoryVerificationSource {
  return {
    type: 'laa',
    label: 'Legal Aid Agency — Directory of legal aid providers',
    url: LAA_DIRECTORY_URL,
    reference: record.accountNumber ? `LAA account ${record.accountNumber}` : undefined,
    dateChecked,
  };
}

function buildDescription(record: LaaProviderRecord, categorySlug: string, categoryLabel: string): string {
  const where = record.town ? ` in ${record.town}` : '';
  const contractLabel =
    categorySlug === 'solicitors' ? 'crime legal aid' : categoryLabel.toLowerCase();
  return (
    `${record.firmName} is listed in the Legal Aid Agency's published Directory of legal aid ` +
    `providers as holding a ${contractLabel} legal aid contract${where}. ` +
    `This entry was created automatically from published LAA data and is currently unclaimed — ` +
    `the firm has not yet confirmed or completed its details. If this is your firm, you can claim ` +
    `this listing to add contact information, specialisms, and coverage.`
  );
}

export interface BuildStubOptions {
  /** ISO date (YYYY-MM-DD) recorded as the LAA check date. Defaults to today. */
  dateChecked?: string;
}

/**
 * Build a complete, unclaimed, source-verified listing from an LAA record.
 * Pure: does not touch storage.
 */
export function buildLaaProviderStub(
  record: LaaProviderRecord,
  options: BuildStubOptions = {},
): LegalDirectoryListing {
  const dateChecked = options.dateChecked ?? new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();
  const categorySlug = categorySlugFromLaaCategory(record.category);
  const category = getCategoryBySlug(categorySlug);
  const key = laaProviderKey(record);
  const slug = buildListingSlug(record.firmName, record.town ?? '', key).slice(0, 120);

  const sources = [buildLaaVerificationSource(record, dateChecked)];
  const verification = computeListingVerification(sources);
  const categoryLabel = category?.label ?? 'Criminal Defence Solicitors';

  return {
    id: `laa-${key}`,
    businessName: record.firmName,
    slug,
    providerType: category?.providerType ?? 'Criminal defence solicitor',
    category: categoryLabel,
    categorySlug,
    contactPerson: '',
    email: '',
    phone: record.phone ?? '',
    emergencyPhone: '',
    websiteUrl: '',
    addressLine1: '',
    addressLine2: '',
    town: record.town ?? '',
    county: record.county ?? '',
    postcode: record.postcode ?? '',
    region: '',
    areasCovered: '',
    policeStationsCovered: '',
    courtsCovered: '',
    description: buildDescription(record, categorySlug, categoryLabel),
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
    sourceUrl: LAA_DIRECTORY_URL,
    dateVerified: verification.dateVerified,
    verificationStatus: verification.status,
    verificationSources: sources,
    dateSubmitted: now,
    dateApproved: now,
    lastUpdated: now,
    deletionRequestedAt: null,
    seoTitle: buildSeoTitle(record.firmName, categorySlug, record.town ?? '', record.county ?? ''),
    seoDescription:
      `${record.firmName} — legal aid provider (${categoryLabel}) listed from published LAA data. Unclaimed listing.`.slice(
        0,
        160,
      ),
    keywords: '',
    views: 0,
    enquiryCount: 0,
    ownerEmail: '',
    managementTokenHash: '',
    managementTokenExpiresAt: null,
    riskScore: 0,
    reviewFlags: [],
    moderationNotes: `[seed:laa] Imported from LAA Directory of legal aid providers on ${dateChecked}.`,
    pendingChanges: null,
  };
}

/** A seeded LAA listing that nobody has claimed yet. */
export function isUnclaimedSeededListing(listing: LegalDirectoryListing): boolean {
  return (
    !listing.ownerEmail &&
    listing.id.startsWith('laa-') &&
    listing.moderationNotes.includes('[seed:laa]')
  );
}
