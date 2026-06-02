/**
 * Legal Services Directory — provider listing verification model.
 *
 * A provider listing's `verificationStatus` is derived from the authoritative
 * sources attached to it, using a three-tier model:
 *
 *   Tier A (register)      — front-line regulator / official register. A single
 *                            Tier A confirmation is sufficient to mark verified
 *                            (e.g. SRA, BSB, CILEx Regulation, LAA provider data).
 *   Tier B (corroborating) — strong but secondary official sources. Two distinct
 *                            Tier B sources together mark verified
 *                            (e.g. Law Society Find a Solicitor, Bar Council,
 *                            Companies House, an official force/court page).
 *   Tier C (mention)       — weak signals that never verify on their own
 *                            (e.g. the firm's own website, a news mention).
 */

export type LegalVerificationTier = 'A' | 'B' | 'C';

export type LegalVerificationSourceType =
  | 'sra'
  | 'bsb'
  | 'cilex'
  | 'laa'
  | 'law_society'
  | 'bar_council'
  | 'companies_house'
  | 'official_page'
  | 'website'
  | 'news'
  | 'other';

export interface LegalDirectoryVerificationSource {
  type: LegalVerificationSourceType;
  /** Human-readable label, e.g. "SRA — Check a solicitor's record". */
  label: string;
  url: string;
  /** Optional reference recorded against the source (e.g. SRA ID, company no.). */
  reference?: string;
  /** ISO date (YYYY-MM-DD) the source was checked. */
  dateChecked: string;
}

/** Tier each source type maps to. */
export const SOURCE_TYPE_TIER: Record<LegalVerificationSourceType, LegalVerificationTier> = {
  sra: 'A',
  bsb: 'A',
  cilex: 'A',
  laa: 'A',
  law_society: 'B',
  bar_council: 'B',
  companies_house: 'B',
  official_page: 'B',
  website: 'C',
  news: 'C',
  other: 'C',
};

export function tierForSource(source: LegalDirectoryVerificationSource): LegalVerificationTier {
  return SOURCE_TYPE_TIER[source.type] ?? 'C';
}

export interface ComputedListingVerification {
  status: 'verified' | 'unverified';
  /** Most recent qualifying source date, or null when unverified. */
  dateVerified: string | null;
  /** The single source that best supports the verified status, if any. */
  primarySource: LegalDirectoryVerificationSource | null;
  tierACount: number;
  tierBCount: number;
}

/** Number of distinct Tier B sources required to reach verified without a Tier A. */
export const TIER_B_THRESHOLD = 2;

function maxDate(dates: string[]): string | null {
  const valid = dates.filter(Boolean).sort();
  return valid.length ? valid[valid.length - 1] : null;
}

/**
 * Pure derivation of a listing's verification state from its sources.
 * Does not mutate; callers decide whether to persist the result.
 */
export function computeListingVerification(
  sources: LegalDirectoryVerificationSource[] | undefined | null,
): ComputedListingVerification {
  const list = Array.isArray(sources) ? sources : [];
  const tierA = list.filter((s) => tierForSource(s) === 'A');
  const tierB = list.filter((s) => tierForSource(s) === 'B');

  const verified = tierA.length >= 1 || tierB.length >= TIER_B_THRESHOLD;

  let primarySource: LegalDirectoryVerificationSource | null = null;
  if (tierA.length) {
    primarySource = [...tierA].sort((a, b) => a.dateChecked.localeCompare(b.dateChecked)).pop() ?? null;
  } else if (verified) {
    primarySource = [...tierB].sort((a, b) => a.dateChecked.localeCompare(b.dateChecked)).pop() ?? null;
  }

  const qualifying = tierA.length ? tierA : verified ? tierB : [];
  const dateVerified = verified ? maxDate(qualifying.map((s) => s.dateChecked)) : null;

  return {
    status: verified ? 'verified' : 'unverified',
    dateVerified,
    primarySource,
    tierACount: tierA.length,
    tierBCount: tierB.length,
  };
}
