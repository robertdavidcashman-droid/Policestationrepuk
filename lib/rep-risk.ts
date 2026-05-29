/**
 * Risk scoring for the Rep Verification Audit admin view.
 *
 * For every existing rep (static seed or KV registration) we compute:
 *   - a risk category: low | medium | high | reject | ineligible
 *   - a list of human-readable risk reasons
 *
 * High-risk / ineligible / duplicate / fake rows are hidden from the public
 * directory automatically until an admin manually reviews them.
 */

import type { Representative } from './types';
import {
  looksIneligible,
  type RepVerificationStatus,
  PUBLIC_VERIFIED_STATUSES,
} from './rep-status';

export type RepRiskCategory =
  | 'low'
  | 'medium'
  | 'high'
  | 'reject'
  | 'ineligible';

export const RISK_LABELS: Record<RepRiskCategory, string> = {
  low: 'Low risk — likely genuine',
  medium: 'Medium risk — needs evidence',
  high: 'High risk — hide pending review',
  reject: 'Reject — fake / spam / duplicate',
  ineligible: 'Ineligible — probationary / trainee / unaccredited',
};

export interface RepRiskAssessment {
  category: RepRiskCategory;
  /** Human-readable reasons (admin-only) explaining the score. */
  reasons: string[];
  highRiskFlags: string[];
  mediumRiskFlags: string[];
  lowRiskIndicators: string[];
  /** Whether this profile should be hidden from /directory pending review. */
  shouldHide: boolean;
}

export interface RiskInputProfile {
  email: string;
  phone: string;
  name: string;
  accreditation: string;
  status?: RepVerificationStatus | null;
  pinNumber?: string;
  sraNumber?: string;
  accreditationProofFile?: string;
  fullPostalAddress?: string;
  firmName?: string;
  professionalProfileUrl?: string;
  ipAddress?: string;
  registeredAt?: string | null;
  lastVerifiedDate?: string | null;
  counties: string[];
  stations: string[];
  notes: string;
  publicProfileNotes?: string;
  adminApproved?: boolean | null;
  isPublic?: boolean | null;
}

/** Names that almost always indicate test fixtures or stub data. */
const FAKE_NAME_PATTERNS = [
  /^test\b/i,
  /^admin\b/i,
  /^unknown\b/i,
  /^lorem\s*ipsum\b/i,
  /^john\s+doe\b/i,
  /^jane\s+doe\b/i,
  /^asdf/i,
  /^qwerty/i,
];

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'sharklasers.com',
  'guerrillamail.com',
  'trashmail.com',
  'yopmail.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'getairmail.com',
  'maildrop.cc',
]);

function nonEmpty(s: string | undefined | null): boolean {
  return Boolean(s && s.trim());
}

function domainOf(email: string): string {
  const at = email.lastIndexOf('@');
  if (at === -1) return '';
  return email.slice(at + 1).toLowerCase().trim();
}

function looksLikeNonUKPhone(raw: string): boolean {
  const cleaned = raw.replace(/[\s\-()]/g, '');
  if (!cleaned) return false;
  if (cleaned.startsWith('+44')) return false;
  if (cleaned.startsWith('0')) return false;
  if (cleaned.startsWith('+')) return true;
  return false;
}

function countLinks(text: string): number {
  if (!text) return 0;
  const m = text.match(/https?:\/\/|www\./gi);
  return m ? m.length : 0;
}

function hoursSince(ts: string | null | undefined): number | null {
  if (!ts) return null;
  const t = Date.parse(ts);
  if (!Number.isFinite(t)) return null;
  return (Date.now() - t) / (60 * 60 * 1000);
}

export function scoreRepRisk(rep: RiskInputProfile): RepRiskAssessment {
  const high: string[] = [];
  const medium: string[] = [];
  const low: string[] = [];

  const accLower = (rep.accreditation || '').toLowerCase();
  const isPsras = /psras|accredited\s*(rep|police)/i.test(rep.accreditation);
  const isDuty = /duty\s*solicitor/i.test(rep.accreditation);
  const isSolicitor = /solicitor/i.test(rep.accreditation) && !isDuty;

  // ---- Ineligibility short-circuit (takes precedence) ----
  if (looksIneligible(rep.accreditation, rep.publicProfileNotes, rep.notes)) {
    high.push('Claims probationary / trainee / studying / awaiting accreditation');
    return {
      category: 'ineligible',
      reasons: high.slice(),
      highRiskFlags: high,
      mediumRiskFlags: medium,
      lowRiskIndicators: low,
      shouldHide: true,
    };
  }

  // ---- HIGH ----
  if (!nonEmpty(rep.phone)) high.push('No phone number');
  if (!nonEmpty(rep.email)) high.push('No email address');

  // PSRAS reps need EITHER a PIN OR a proof URL — supplying one alone is fine.
  // Treat the "no PIN" / "no proof" flags as MEDIUM individually; only flag
  // HIGH when neither has been supplied (i.e. zero accreditation evidence).
  if (isPsras && !nonEmpty(rep.pinNumber) && !nonEmpty(rep.accreditationProofFile)) {
    high.push('PSRAS claimed but no PIN and no proof of accreditation');
  } else {
    if (isPsras && !nonEmpty(rep.pinNumber)) medium.push('PSRAS claimed but no PIN supplied');
    if (isPsras && !nonEmpty(rep.accreditationProofFile)) {
      medium.push('PSRAS claimed but no proof of accreditation URL');
    }
  }

  // Solicitors / duty solicitors need EITHER an SRA number OR a proof URL.
  // Having an SRA number is by far the stronger signal — accept it on its
  // own and only flag HIGH when both are missing.
  if (
    (isDuty || isSolicitor) &&
    !nonEmpty(rep.sraNumber) &&
    !nonEmpty(rep.accreditationProofFile)
  ) {
    high.push(
      isDuty
        ? 'Duty solicitor claimed but no SRA number and no proof URL'
        : 'Solicitor claimed but no SRA number and no proof URL',
    );
  } else if ((isDuty || isSolicitor) && !nonEmpty(rep.sraNumber)) {
    medium.push(
      isDuty
        ? 'Duty solicitor claimed without an SRA number (proof URL supplied instead)'
        : 'Solicitor claimed without an SRA number (proof URL supplied instead)',
    );
  }

  const domain = domainOf(rep.email || '');
  if (domain && DISPOSABLE_DOMAINS.has(domain)) {
    high.push(`Disposable / suspicious email domain (${domain})`);
  }

  if (countLinks((rep.notes || '') + ' ' + (rep.publicProfileNotes || '')) > 1) {
    high.push('Spam-style links in profile notes');
  }

  if (looksLikeNonUKPhone(rep.phone || '')) {
    high.push('Non-UK phone number without explanation');
  }

  if (rep.counties.length >= 30) {
    high.push(`Covers ${rep.counties.length} counties (unrealistic)`);
  }

  if (rep.counties.length > 0 && rep.stations.length === 0) {
    high.push('Lists counties but no specific police stations');
  }

  const trimmedName = (rep.name || '').trim();
  if (trimmedName && !trimmedName.includes(' ')) {
    high.push('Only first name supplied');
  }

  if (FAKE_NAME_PATTERNS.some((p) => p.test(trimmedName))) {
    high.push('Name appears to be a test / placeholder');
  }

  const hours = hoursSince(rep.registeredAt);
  if (
    hours != null &&
    hours < 48 &&
    (!nonEmpty(rep.pinNumber) && !nonEmpty(rep.sraNumber))
  ) {
    high.push('Recently created (<48h) with incomplete accreditation evidence');
  }

  // ---- MEDIUM ----
  if (!nonEmpty(rep.firmName)) medium.push('No firm name');
  if (!nonEmpty(rep.professionalProfileUrl)) medium.push('No professional webpage / LinkedIn');
  if (rep.counties.length === 0) medium.push('No coverage counties listed');
  if (
    (accLower.includes('accredited') || accLower.includes('rep')) &&
    !isPsras &&
    !nonEmpty(rep.pinNumber)
  ) {
    medium.push('Generic accreditation wording');
  }
  if (!rep.lastVerifiedDate) medium.push('No last-verified date on record');
  if (rep.adminApproved !== true) medium.push('No admin approval record');

  // ---- LOW indicators ----
  if (nonEmpty(rep.pinNumber)) low.push('PIN supplied');
  if (nonEmpty(rep.sraNumber)) low.push('SRA number supplied');
  if (nonEmpty(rep.firmName)) low.push('Firm details supplied');
  if (nonEmpty(rep.professionalProfileUrl)) low.push('Professional webpage supplied');
  if (rep.counties.length > 0 && rep.counties.length <= 5) low.push('Sensible local coverage');
  if (rep.stations.length > 0) low.push('Police stations listed');
  if (rep.lastVerifiedDate) low.push('Last-verified date exists');
  if (rep.adminApproved === true) low.push('Admin approval exists');

  let category: RepRiskCategory = 'low';
  if (high.length >= 1) category = 'high';
  if (medium.length >= 3 && category === 'low') category = 'medium';

  // Hide rules: high-risk / suspended / rejected / removed / duplicate / fake
  const dangerStatus =
    rep.status === 'rejected' ||
    rep.status === 'suspended' ||
    rep.status === 'removed' ||
    rep.status === 'duplicate-or-fake' ||
    rep.status === 'ineligible-probationary-or-trainee';

  const cat = category as RepRiskCategory;
  const shouldHide =
    cat === 'high' ||
    cat === 'ineligible' ||
    cat === 'reject' ||
    dangerStatus ||
    !rep.status ||
    !PUBLIC_VERIFIED_STATUSES.has(rep.status as never);

  return {
    category,
    reasons: [...high, ...medium.slice(0, 5)],
    highRiskFlags: high,
    mediumRiskFlags: medium,
    lowRiskIndicators: low,
    shouldHide,
  };
}

/** Human-readable label for which public register matched. */
export function publicRegisterMatchLabel(
  source?: 'sra' | 'dscc' | 'law-society' | 'multiple' | null,
): string {
  switch (source) {
    case 'sra':
      return 'SRA Solicitors Register';
    case 'law-society':
      return 'Law Society Find a Solicitor';
    case 'dscc':
      return 'DSCC accredited register';
    case 'multiple':
      return 'multiple public registers';
    default:
      return 'a public register (SRA, Law Society, or DSCC)';
  }
}

/**
 * Reps matched on the SRA, Law Society, or DSCC public registers are treated
 * as low risk — the register match is stronger evidence than heuristic flags.
 */
export function lowRiskForPublicRegisterMatch(
  source?: 'sra' | 'dscc' | 'law-society' | 'multiple' | null,
  detail?: string,
): RepRiskAssessment {
  const label = publicRegisterMatchLabel(source);
  const reasons = [`Verified on ${label}`];
  if (detail) reasons.push(detail);
  return {
    category: 'low',
    reasons,
    highRiskFlags: [],
    mediumRiskFlags: [],
    lowRiskIndicators: [`Matched ${label}`],
    shouldHide: false,
  };
}

/** Override heuristic risk scoring when a public register match exists. */
export function applyRegisterVerifiedLowRisk(
  assessment: RepRiskAssessment,
  registerVerified: boolean,
  source?: 'sra' | 'dscc' | 'law-society' | 'multiple' | null,
  detail?: string,
): RepRiskAssessment {
  if (!registerVerified || assessment.category === 'ineligible') return assessment;
  return lowRiskForPublicRegisterMatch(source, detail);
}

/** True when admin review notes record an automatic public-register verification. */
export function isPublicRegisterVerifiedReview(adminNotes: string | null | undefined): boolean {
  if (!adminNotes) return false;
  if (adminNotes.includes('Passed regulatory directory check')) return true;
  return /matched (?:sra|dscc|law-society|multiple) public register/i.test(adminNotes);
}

/** Convenience overload that scores a fully merged `Representative`. */
export function scoreRepresentativeRisk(
  rep: Representative,
  extra: Partial<RiskInputProfile> = {},
): RepRiskAssessment {
  return scoreRepRisk({
    email: rep.email,
    phone: rep.phone,
    name: rep.name,
    accreditation: rep.accreditation,
    pinNumber: rep.dsccPin || extra.pinNumber,
    sraNumber: extra.sraNumber,
    accreditationProofFile: extra.accreditationProofFile,
    fullPostalAddress: extra.fullPostalAddress,
    firmName: extra.firmName,
    professionalProfileUrl: rep.websiteUrl || extra.professionalProfileUrl,
    counties: Array.isArray(rep.counties)
      ? rep.counties
      : rep.county
        ? [rep.county]
        : [],
    stations: rep.stations || [],
    notes: rep.notes || rep.bio || '',
    publicProfileNotes: extra.publicProfileNotes,
    registeredAt: extra.registeredAt ?? null,
    lastVerifiedDate: extra.lastVerifiedDate ?? null,
    status: extra.status ?? null,
    adminApproved: extra.adminApproved ?? null,
    isPublic: extra.isPublic ?? null,
    ipAddress: extra.ipAddress,
  });
}

export type DuplicateKind = 'email' | 'phone' | 'pin' | 'sra' | 'ip' | 'name';

export interface DuplicateInput {
  email: string;
  phone?: string;
  pinNumber?: string;
  sraNumber?: string;
  ipAddress?: string;
  name?: string;
}

/** Build duplicate lookup indexes from a population of audited rows. */
export function buildDuplicateIndex(rows: Iterable<DuplicateInput>): Record<DuplicateKind, Map<string, string[]>> {
  const idx: Record<DuplicateKind, Map<string, string[]>> = {
    email: new Map(),
    phone: new Map(),
    pin: new Map(),
    sra: new Map(),
    ip: new Map(),
    name: new Map(),
  };
  for (const r of rows) {
    const id = r.email.toLowerCase();
    const push = (kind: DuplicateKind, key: string | undefined) => {
      if (!key) return;
      const k = key.toString().trim().toLowerCase();
      if (!k) return;
      const arr = idx[kind].get(k) ?? [];
      if (!arr.includes(id)) arr.push(id);
      idx[kind].set(k, arr);
    };
    push('email', r.email);
    push('phone', (r.phone || '').replace(/[\s\-()]/g, ''));
    push('pin', r.pinNumber);
    push('sra', r.sraNumber);
    push('ip', r.ipAddress);
    push('name', r.name);
  }
  return idx;
}

/** Returns the duplicate-flag reasons for a given row given a prebuilt index. */
export function duplicateReasons(
  input: DuplicateInput,
  idx: Record<DuplicateKind, Map<string, string[]>>,
): string[] {
  const reasons: string[] = [];
  const id = input.email.toLowerCase();
  const check = (kind: DuplicateKind, key: string | undefined, label: string) => {
    if (!key) return;
    const k = key.toString().trim().toLowerCase();
    if (!k) return;
    const ids = idx[kind].get(k) ?? [];
    if (ids.length > 1 && ids.some((other) => other !== id)) {
      reasons.push(`Duplicate ${label} shared with ${ids.length - 1} other profile(s)`);
    }
  };
  check('email', input.email, 'email');
  check('phone', (input.phone || '').replace(/[\s\-()]/g, ''), 'phone number');
  check('pin', input.pinNumber, 'PIN number');
  check('sra', input.sraNumber, 'SRA number');
  check('ip', input.ipAddress, 'IP address');
  check('name', input.name, 'full name');
  return reasons;
}
