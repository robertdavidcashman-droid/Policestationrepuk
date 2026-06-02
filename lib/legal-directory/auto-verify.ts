/**
 * Legal Services Directory — auto-verification of provider listings on submit.
 *
 * When a listing supplies a regulatory body + number we recognise, we check the
 * relevant public register and, on a confident match, attach a Tier A
 * verification source. The listing's verificationStatus is then derived from its
 * sources (see verification-sources.ts). Network lookups are best-effort and
 * never block submission: failures simply leave the listing unverified.
 */

import { lookupSraPersonByNumber } from '@/lib/sra-register-lookup';
import { saveListing } from './storage';
import type { LegalDirectoryListing } from './types';
import {
  computeListingVerification,
  type ComputedListingVerification,
  type LegalDirectoryVerificationSource,
} from './verification-sources';

export type RecognisedRegulator = 'sra' | 'bsb' | 'cilex' | 'laa';

export interface AutoVerifyInput {
  businessName: string;
  contactPerson?: string;
  regulatoryBody?: string;
  regulatoryNumber?: string;
}

export interface AutoVerifyResult {
  sources: LegalDirectoryVerificationSource[];
  verification: ComputedListingVerification;
}

/** Map free-text regulatory body to a register we can check. */
export function detectRegulator(body: string | undefined | null): RecognisedRegulator | null {
  const b = (body ?? '').toLowerCase();
  if (!b) return null;
  if (b.includes('sra') || b.includes('solicitors regulation')) return 'sra';
  if (b.includes('bsb') || b.includes('bar standards')) return 'bsb';
  if (b.includes('cilex')) return 'cilex';
  if (b.includes('laa') || b.includes('legal aid')) return 'laa';
  return null;
}

const today = () => new Date().toISOString().slice(0, 10);

/** Build a Tier A SRA verification source from a confirmed register record. */
export function buildSraVerificationSource(
  name: string,
  sraNumber: string,
  dateChecked: string = today(),
): LegalDirectoryVerificationSource {
  const num = sraNumber.replace(/\D/g, '');
  return {
    type: 'sra',
    label: `SRA register — regulated record for ${name}`,
    url: `https://www.sra.org.uk/consumers/register/person/?sraNumber=${num}`,
    reference: `SRA #${num}`,
    dateChecked,
  };
}

/**
 * Derive verification sources for a listing by checking public registers.
 * Currently supports the SRA register via a supplied SRA number.
 */
export async function deriveListingVerification(input: AutoVerifyInput): Promise<AutoVerifyResult> {
  const sources: LegalDirectoryVerificationSource[] = [];
  const regulator = detectRegulator(input.regulatoryBody);
  const num = (input.regulatoryNumber ?? '').replace(/\D/g, '');

  // Only the SRA number lookup is automated for now. Treat a bare number with no
  // (or an SRA) regulator as an SRA candidate; other regulators are left for the
  // verification script / manual review.
  const sraCandidate = num.length >= 5 && (regulator === 'sra' || regulator === null);
  if (sraCandidate) {
    try {
      const res = await lookupSraPersonByNumber(num, input.contactPerson || input.businessName);
      if (res.matched && res.person) {
        sources.push(buildSraVerificationSource(res.person.name, res.person.sraNumber || num));
      }
    } catch (err) {
      console.warn('[legal-auto-verify] SRA lookup failed:', err);
    }
  }

  return { sources, verification: computeListingVerification(sources) };
}

export interface ApplyAutoVerifyResult {
  listing: LegalDirectoryListing;
  changed: boolean;
  verified: boolean;
}

/**
 * Run auto-verification against a freshly-created listing and persist any
 * resulting sources + derived status. Best-effort; safe to call fire-and-forget.
 */
export async function applyAutoVerificationToListing(
  listing: LegalDirectoryListing,
): Promise<ApplyAutoVerifyResult> {
  const { sources, verification } = await deriveListingVerification({
    businessName: listing.businessName,
    contactPerson: listing.contactPerson,
    regulatoryBody: listing.regulatoryBody,
    regulatoryNumber: listing.regulatoryNumber,
  });

  if (sources.length === 0) {
    return { listing, changed: false, verified: false };
  }

  const updated: LegalDirectoryListing = {
    ...listing,
    verificationSources: sources,
    verificationStatus: verification.status,
    dateVerified: verification.dateVerified,
    sourceUrl: verification.primarySource?.url || listing.sourceUrl,
  };

  await saveListing(updated);
  return { listing: updated, changed: true, verified: verification.status === 'verified' };
}
