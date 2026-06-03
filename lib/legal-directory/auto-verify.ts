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
import { lookupBsbPerson } from '@/lib/bsb-register-lookup';
import { lookupCilexMember, isPlausibleCilexMemberNumber } from '@/lib/cilex-register-lookup';
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

/** Build a Tier A BSB verification source from a confirmed register record. */
export function buildBsbVerificationSource(
  name: string,
  dateChecked: string = today(),
): LegalDirectoryVerificationSource {
  return {
    type: 'bsb',
    label: `BSB Barristers' Register — ${name}`,
    url: 'https://www.barstandardsboard.org.uk/for-the-public/search-a-barristers-record/the-barristers-register.html',
    reference: name,
    dateChecked,
  };
}

/** Build a Tier A CILEx verification source from a confirmed register record. */
export function buildCilexVerificationSource(
  memberNumber: string,
  dateChecked: string = today(),
): LegalDirectoryVerificationSource {
  return {
    type: 'cilex',
    label: 'CILEx Regulation — membership confirmed',
    url: 'https://www.cilexregulation.org.uk/regulation/find-a-regulated-individual/',
    reference: `CILEx #${memberNumber.replace(/\D/g, '')}`,
    dateChecked,
  };
}

/**
 * Derive verification sources for a listing by checking public registers.
 */
export async function deriveListingVerification(input: AutoVerifyInput): Promise<AutoVerifyResult> {
  const sources: LegalDirectoryVerificationSource[] = [];
  const regulator = detectRegulator(input.regulatoryBody);
  const num = (input.regulatoryNumber ?? '').replace(/\D/g, '');
  const personName = (input.contactPerson || input.businessName || '').trim();
  const dateChecked = today();

  const sraCandidate = num.length >= 5 && (regulator === 'sra' || regulator === null);
  if (sraCandidate) {
    try {
      const res = await lookupSraPersonByNumber(num, personName);
      if (res.matched && res.person) {
        sources.push(buildSraVerificationSource(res.person.name, res.person.sraNumber || num, dateChecked));
      }
    } catch (err) {
      console.warn('[legal-auto-verify] SRA lookup failed:', err);
    }
  }

  if (regulator === 'bsb' && personName) {
    try {
      const res = await lookupBsbPerson({ name: personName, businessName: input.businessName });
      if (res.matched && res.person) {
        sources.push(buildBsbVerificationSource(res.person.name, dateChecked));
      }
    } catch (err) {
      console.warn('[legal-auto-verify] BSB lookup failed:', err);
    }
  }

  if (regulator === 'cilex' && isPlausibleCilexMemberNumber(input.regulatoryNumber ?? '')) {
    try {
      const res = await lookupCilexMember({ memberNumber: num, name: personName });
      if (res.matched) {
        sources.push(buildCilexVerificationSource(num, dateChecked));
      }
    } catch (err) {
      console.warn('[legal-auto-verify] CILEx lookup failed:', err);
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
