import { lookupDsccPersonByName, lookupDsccPersonByPinAndName, type DsccLookupResult, type DsccPinLookupResult } from '@/lib/dscc-register-lookup';
import {
  lookupLawSocietyPerson,
  type LawSocietyLookupResult,
} from '@/lib/law-society-register-lookup';
import { lookupSraPerson, type SraLookupResult } from '@/lib/sra-register-lookup';
import { sendRegulatoryRegisterNoMatchAlert } from '@/lib/email';
import {
  applyRegisterVerifiedLowRisk,
  lowRiskForPublicRegisterMatch,
  scoreRepresentativeRisk,
  type RepRiskAssessment,
} from '@/lib/rep-risk';
import { getKV, skipKVInPrerender } from '@/lib/kv';
import { listAllVerifications } from '@/lib/rep-verification';
import {
  type ApplicantCategory,
  looksIneligible,
  type PublicVerifiedStatus,
  type RepVerificationStatus,
} from '@/lib/rep-status';
import { loadAllReviews, setReview, type RepReview } from '@/lib/admin-review';
import { getAllRepsForAdmin, invalidateProfileCache, invalidateRegisteredRepsCache } from '@/lib/data';
import type { Representative } from '@/lib/types';
import { repIsAutomatedDirectoryTest } from '@/lib/directory-blocklist';
import { ensureDsccRegisterCache } from '@/lib/dscc-register-lookup';

export interface RegulatoryDirectoryInput {
  email: string;
  name: string;
  sraNumber?: string;
  pinNumber?: string;
  category?: ApplicantCategory | null;
}

export interface RegulatoryDirectoryCheck {
  sra: SraLookupResult;
  lawSociety: LawSocietyLookupResult;
  dscc: DsccLookupResult;
  dsccPin: DsccPinLookupResult | null;
  passed: boolean;
  passSource: 'sra' | 'dscc' | 'law-society' | 'multiple' | null;
  suggestedStatus: PublicVerifiedStatus | null;
  note: string;
}

export interface NewRepRegulatoryContext {
  email: string;
  name: string;
  sraNumber?: string;
  pinNumber?: string;
  category?: ApplicantCategory | null;
  firmName?: string;
  profileUrl?: string;
  consentPublic?: boolean;
  existingReview?: RepReview | null;
  reviewer?: string;
  source: 'register' | 'secure-verification';
}

function categoryToVerifiedStatus(category: ApplicantCategory): PublicVerifiedStatus {
  switch (category) {
    case 'psras-accredited':
      return 'verified-psras';
    case 'duty-solicitor':
      return 'verified-duty-solicitor';
    case 'solicitor':
      return 'verified-solicitor';
  }
}

function inferStatusFromMatch(
  category: ApplicantCategory | null | undefined,
  sraMatched: boolean,
  dsccMatched: boolean,
  lawSocietyMatched: boolean,
): PublicVerifiedStatus {
  if (category) return categoryToVerifiedStatus(category);
  if ((sraMatched || lawSocietyMatched) && !dsccMatched) return 'verified-solicitor';
  if (dsccMatched && !sraMatched && !lawSocietyMatched) return 'verified-psras';
  if (sraMatched || lawSocietyMatched || dsccMatched) return 'verified-solicitor';
  return 'verified-psras';
}

function resolvePassSource(
  sraMatched: boolean,
  dsccMatched: boolean,
  lawSocietyMatched: boolean,
): RegulatoryDirectoryCheck['passSource'] {
  const hits = [
    sraMatched ? 'sra' : null,
    dsccMatched ? 'dscc' : null,
    lawSocietyMatched ? 'law-society' : null,
  ].filter(Boolean);
  if (hits.length === 0) return null;
  if (hits.length === 1) return hits[0] as NonNullable<RegulatoryDirectoryCheck['passSource']>;
  return 'multiple';
}

export async function checkRegulatoryDirectories(
  input: RegulatoryDirectoryInput,
): Promise<RegulatoryDirectoryCheck> {
  const sra = await lookupSraPerson({ name: input.name, sraNumber: input.sraNumber });
  const dsccPinPromise = input.pinNumber
    ? lookupDsccPersonByPinAndName(input.name, input.pinNumber)
    : Promise.resolve(null);
  const [dscc, lawSociety, dsccPin] = await Promise.all([
    lookupDsccPersonByName(input.name),
    lookupLawSocietyPerson({ name: input.name, sraNumber: input.sraNumber }, sra),
    dsccPinPromise,
  ]);

  const sraMatched = sra.matched;
  const dsccNameMatched = dscc.matched;
  const dsccPinMatched = dsccPin?.matched ?? false;
  const dsccMatched = dsccNameMatched || dsccPinMatched;
  const lawSocietyMatched = lawSociety.matched;
  const passed = sraMatched || dsccMatched || lawSocietyMatched;
  const passSource = resolvePassSource(sraMatched, dsccMatched, lawSocietyMatched);

  const suggestedStatus = passed
    ? inferStatusFromMatch(input.category, sraMatched, dsccMatched, lawSocietyMatched)
    : null;

  const noteParts: string[] = [];
  if (sraMatched && sra.person) {
    noteParts.push(
      `SRA register: ${sra.person.name} (#${sra.person.sraNumber}) via ${sra.source}.`,
    );
  } else if (sra.found) {
    noteParts.push('SRA register: record found but name/number did not match.');
  } else {
    noteParts.push('SRA register: no match.');
  }

  if (lawSocietyMatched && lawSociety.person) {
    noteParts.push(
      `Law Society register: ${lawSociety.person.name}` +
        (lawSociety.person.sraNumber ? ` (#${lawSociety.person.sraNumber})` : '') +
        ` via ${lawSociety.source}.`,
    );
  } else if (lawSociety.found) {
    noteParts.push('Law Society register: record found but name did not match.');
  } else {
    noteParts.push('Law Society register: no match.');
  }

  if (dsccPinMatched && dsccPin) {
    noteParts.push(dsccPin.note);
  } else if (input.pinNumber) {
    noteParts.push(
      dsccPin?.note ?? 'DSCC PIN supplied but name not matched on accredited register.',
    );
  }

  if (dsccMatched) {
    const sample = (dsccPinMatched && dsccPin?.entries[0]) || dscc.entries[0];
    if (sample && !dsccPinMatched) {
      noteParts.push(
        `DSCC accredited register: ${sample.forename} ${sample.surname}` +
          (sample.firm ? ` (${sample.firm})` : '') +
          (dscc.entries.length > 1 ? ` +${dscc.entries.length - 1} more` : '') +
          '.',
      );
    }
  } else if (!input.pinNumber) {
    noteParts.push('DSCC accredited register: no match.');
  }

  return {
    sra,
    lawSociety,
    dscc,
    dsccPin,
    passed,
    passSource,
    suggestedStatus,
    note: noteParts.join(' '),
  };
}

/**
 * Run SRA + Law Society + DSCC checks when a new rep joins. Auto-publishes on
 * any register match; emails the regulatory alert address when none match.
 */
export async function runNewRepRegulatoryVerification(
  ctx: NewRepRegulatoryContext,
): Promise<ApplyRegulatoryAutoPassResult> {
  const autoPass = await applyRegulatoryAutoPass({
    email: ctx.email,
    name: ctx.name,
    sraNumber: ctx.sraNumber,
    pinNumber: ctx.pinNumber,
    category: ctx.category,
    existingReview: ctx.existingReview,
    reviewer: ctx.reviewer ?? `system:${ctx.source}`,
    consentPublic: ctx.consentPublic,
  });

  if (!autoPass.check.passed) {
    sendRegulatoryRegisterNoMatchAlert({
      name: ctx.name,
      email: ctx.email,
      sraNumber: ctx.sraNumber,
      pinNumber: ctx.pinNumber,
      firmName: ctx.firmName,
      profileUrl: ctx.profileUrl,
      source: ctx.source,
      sraMatched: autoPass.check.sra.matched,
      lawSocietyMatched: autoPass.check.lawSociety.matched,
      dsccMatched: autoPass.check.dscc.matched,
      note: autoPass.check.note,
    }).catch((err) => console.warn('[regulatory-auto-pass] no-match alert failed:', err));
  }

  return autoPass;
}

const AUTO_PASS_BLOCKED_STATUSES: ReadonlySet<RepVerificationStatus> = new Set([
  'rejected',
  'suspended',
  'removed',
  'duplicate-or-fake',
  'ineligible-probationary-or-trainee',
]);

function reviewBlocksAutoPass(review: RepReview | null | undefined): boolean {
  if (!review) return false;
  const status = review.verificationStatus;
  return Boolean(status && AUTO_PASS_BLOCKED_STATUSES.has(status));
}

export interface ApplyRegulatoryAutoPassResult {
  applied: boolean;
  check: RegulatoryDirectoryCheck;
  reason?: string;
}

/**
 * When a rep is found on the SRA and/or DSCC public registers, mark them
 * verified, admin-approved, and public (presumption of visibility).
 */
export async function applyRegulatoryAutoPass(
  input: RegulatoryDirectoryInput & {
    existingReview?: RepReview | null;
    reviewer?: string;
    consentPublic?: boolean;
  },
): Promise<ApplyRegulatoryAutoPassResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return {
      applied: false,
      check: await checkRegulatoryDirectories({ ...input, email }),
      reason: 'invalid_email',
    };
  }

  const check = await checkRegulatoryDirectories({ ...input, email });

  if (!check.passed || !check.suggestedStatus) {
    return { applied: false, check, reason: 'not_on_register' };
  }

  if (reviewBlocksAutoPass(input.existingReview)) {
    return { applied: false, check, reason: 'blocked_by_review' };
  }

  const now = new Date().toISOString();
  const reviewer = input.reviewer ?? 'system:regulatory-auto-pass';
  const lowRisk = lowRiskForPublicRegisterMatch(check.passSource, check.note);

  await setReview(
    email,
    {
      status: 'approved',
      verificationStatus: check.suggestedStatus,
      adminApproved: true,
      isPublic: input.consentPublic !== false,
      lastVerifiedDate: now,
      riskCategory: lowRisk.category,
      riskReasons: lowRisk.reasons,
      adminNotes:
        `[auto] Passed regulatory directory check (${check.passSource}) at ${now}. ${check.note}`,
    },
    reviewer,
  );

  invalidateProfileCache();
  invalidateRegisteredRepsCache();

  return { applied: true, check };
}

export function isAlreadyPubliclyApproved(review: RepReview | null | undefined): boolean {
  if (!review) return false;
  const status = review.verificationStatus;
  if (!status) return false;
  if (status === 'verified-psras' || status === 'verified-duty-solicitor' || status === 'verified-solicitor') {
    return review.adminApproved === true && review.isPublic === true;
  }
  return false;
}

/** Map free-text accreditation to applicant category when possible. */
export function inferApplicantCategory(accreditation: string): ApplicantCategory | null {
  const a = accreditation.toLowerCase();
  if (a.includes('duty') && a.includes('solicitor')) return 'duty-solicitor';
  if (a.includes('solicitor') || a.includes('sra')) return 'solicitor';
  if (
    a.includes('psras') ||
    a.includes('accredited') ||
    a.includes('representative') ||
    a.includes('rep')
  ) {
    return 'psras-accredited';
  }
  return null;
}

export type { RepVerificationStatus };

export interface RepRegulatoryHints {
  sraNumber?: string;
  pinNumber?: string;
  category?: ApplicantCategory | null;
}

/** Merge SRA/category hints from secure verification records and KV registrations. */
export async function loadRegulatoryHintsByEmail(): Promise<Map<string, RepRegulatoryHints>> {
  const map = new Map<string, RepRegulatoryHints>();
  if (skipKVInPrerender()) return map;

  try {
    const verifications = await listAllVerifications();
    for (const v of verifications) {
      const email = v.email.toLowerCase();
      map.set(email, {
        sraNumber: v.sraNumber || undefined,
        pinNumber: v.pinNumber || undefined,
        category: v.category ?? null,
      });
    }
  } catch (err) {
    console.warn('[regulatory-auto-pass] listAllVerifications failed:', err);
  }

  const kv = getKV();
  if (kv) {
    try {
      const keys = await kv.keys('newrep:*');
      if (keys.length > 0) {
        const pipeline = kv.pipeline();
        for (const key of keys) pipeline.get(key);
        const rows = await pipeline.exec<(Record<string, unknown> | null)[]>();
        for (const row of rows) {
          if (!row || typeof row !== 'object') continue;
          const email = typeof row.email === 'string' ? row.email.toLowerCase() : '';
          if (!email) continue;
          const existing = map.get(email) ?? {};
          const sra =
            typeof row.sra_number === 'string' && row.sra_number.trim()
              ? row.sra_number.trim()
              : existing.sraNumber;
          const pin =
            typeof row.dscc_pin === 'string' && row.dscc_pin.trim()
              ? row.dscc_pin.trim()
              : existing.pinNumber;
          map.set(email, {
            sraNumber: sra,
            pinNumber: pin,
            category: existing.category ?? inferApplicantCategory(String(row.accreditation ?? '')),
          });
        }
      }
    } catch (err) {
      console.warn('[regulatory-auto-pass] newrep scan failed:', err);
    }
  }

  return map;
}

export type RepVerificationSweepAction =
  | 'published-register'
  | 'published-low-risk'
  | 'refreshed'
  | 'skipped-blocked'
  | 'skipped-ineligible'
  | 'skipped-test-rep'
  | 'skipped-no-email'
  | 'not-eligible'
  | 'error';

export interface RepVerificationSweepItem {
  email: string;
  action: RepVerificationSweepAction;
  passSource?: RegulatoryDirectoryCheck['passSource'];
  riskCategory?: string;
  error?: string;
}

export interface RepVerificationSweepSummary {
  scanned: number;
  publishedRegister: number;
  publishedLowRisk: number;
  refreshed: number;
  notEligible: number;
  skipped: number;
  errors: number;
  items: RepVerificationSweepItem[];
  dsccCacheCount: number;
  elapsedMs: number;
}

function isLowRiskForAutoPublish(assessment: RepRiskAssessment): boolean {
  return assessment.category === 'low' && assessment.highRiskFlags.length === 0;
}

function resolveVerifiedStatus(
  category: ApplicantCategory | null,
  check: RegulatoryDirectoryCheck,
): PublicVerifiedStatus {
  if (check.suggestedStatus) return check.suggestedStatus;
  if (category) return categoryToVerifiedStatus(category);
  return 'verified-psras';
}

/**
 * Check one rep against SRA / Law Society / DSCC, score risk, and auto-publish
 * when they match a public register OR score low risk with no high flags.
 */
export async function verifyAndPublishRep(
  rep: Representative,
  hints: RepRegulatoryHints | undefined,
  review: RepReview | null,
  reviewer: string,
): Promise<RepVerificationSweepItem> {
  const email = rep.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { email: email || rep.id, action: 'skipped-no-email' };
  }
  if (repIsAutomatedDirectoryTest(rep)) {
    return { email, action: 'skipped-test-rep' };
  }
  if (looksIneligible(rep.accreditation, rep.notes, rep.bio)) {
    return { email, action: 'skipped-ineligible' };
  }
  if (reviewBlocksAutoPass(review)) {
    return { email, action: 'skipped-blocked' };
  }

  const category = hints?.category ?? inferApplicantCategory(rep.accreditation);
  const wasPublic = isAlreadyPubliclyApproved(review);

  try {
    const check = await checkRegulatoryDirectories({
      email,
      name: rep.name,
      sraNumber: hints?.sraNumber,
      pinNumber: hints?.pinNumber || rep.dsccPin,
      category,
    });

    const baseRisk = scoreRepresentativeRisk(rep, {
      sraNumber: hints?.sraNumber,
      pinNumber: hints?.pinNumber || rep.dsccPin,
      status: review?.verificationStatus ?? null,
      adminApproved: review?.adminApproved ?? null,
      isPublic: review?.isPublic ?? null,
      lastVerifiedDate: review?.lastVerifiedDate ?? null,
    });
    const risk = applyRegisterVerifiedLowRisk(
      baseRisk,
      check.passed,
      check.passSource,
      check.note,
    );

    const registerPass = check.passed;
    const lowRiskPass = isLowRiskForAutoPublish(risk);

    if (!registerPass && !lowRiskPass) {
      return {
        email,
        action: 'not-eligible',
        passSource: check.passSource,
        riskCategory: risk.category,
      };
    }

    const now = new Date().toISOString();
    const verificationStatus = resolveVerifiedStatus(category, check);
    const lowRisk = registerPass
      ? lowRiskForPublicRegisterMatch(check.passSource, check.note)
      : risk;

    const adminNotes = registerPass
      ? `[auto] Passed regulatory directory check (${check.passSource}) at ${now}. ${check.note}`
      : `[auto] Low-risk auto-publish at ${now}. Risk: ${risk.reasons.slice(0, 3).join('; ')}`;

    await setReview(
      email,
      {
        status: 'approved',
        verificationStatus,
        adminApproved: true,
        isPublic: true,
        lastVerifiedDate: now,
        riskCategory: lowRisk.category,
        riskReasons: lowRisk.reasons,
        adminNotes,
      },
      reviewer,
    );

    invalidateProfileCache();
    invalidateRegisteredRepsCache();

    if (wasPublic) {
      return {
        email,
        action: 'refreshed',
        passSource: check.passSource,
        riskCategory: lowRisk.category,
      };
    }
    if (registerPass) {
      return {
        email,
        action: 'published-register',
        passSource: check.passSource,
        riskCategory: lowRisk.category,
      };
    }
    return {
      email,
      action: 'published-low-risk',
      riskCategory: lowRisk.category,
    };
  } catch (err) {
    return {
      email,
      action: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Re-check every rep; auto-show those on a public register or scored low risk. */
export async function verifyAndPublishAllReps(
  reviewer = 'system:regulatory-sweep',
): Promise<RepVerificationSweepSummary> {
  const started = Date.now();
  const dsccCache = await ensureDsccRegisterCache();
  const [reps, reviews, hintsByEmail] = await Promise.all([
    getAllRepsForAdmin(),
    loadAllReviews(),
    loadRegulatoryHintsByEmail(),
  ]);

  const items: RepVerificationSweepItem[] = [];
  let publishedRegister = 0;
  let publishedLowRisk = 0;
  let refreshed = 0;
  let notEligible = 0;
  let skipped = 0;
  let errors = 0;

  for (const rep of reps) {
    const email = rep.email.toLowerCase();
    const item = await verifyAndPublishRep(
      rep,
      hintsByEmail.get(email),
      reviews.get(email) ?? null,
      reviewer,
    );
    items.push(item);

    switch (item.action) {
      case 'published-register':
        publishedRegister++;
        break;
      case 'published-low-risk':
        publishedLowRisk++;
        break;
      case 'refreshed':
        refreshed++;
        break;
      case 'not-eligible':
        notEligible++;
        break;
      case 'error':
        errors++;
        break;
      default:
        skipped++;
        break;
    }

    await new Promise((r) => setTimeout(r, 80));
  }

  return {
    scanned: reps.length,
    publishedRegister,
    publishedLowRisk,
    refreshed,
    notEligible,
    skipped,
    errors,
    items,
    dsccCacheCount: dsccCache?.count ?? 0,
    elapsedMs: Date.now() - started,
  };
}

