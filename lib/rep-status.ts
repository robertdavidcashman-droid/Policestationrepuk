/**
 * Canonical lifecycle / verification statuses for police-station representatives.
 *
 * PoliceStationRepUK only lists fully verified, fully accredited people. The
 * statuses below drive the public-visibility gate in lib/data.ts.
 *
 * Three statuses (and ONLY three) are considered publicly visible — and even
 * then a profile must additionally be `adminApproved`, `isPublic` and have a
 * `lastVerifiedDate` to actually appear in /directory. See `isPubliclyVisible`.
 */

export type RepVerificationStatus =
  | 'enquiry-received'
  | 'verification-link-sent'
  | 'verification-submitted'
  | 'awaiting-evidence'
  | 'evidence-received'
  | 'verified-psras'
  | 'verified-duty-solicitor'
  | 'verified-solicitor'
  | 'rejected'
  | 'suspended'
  | 'removed'
  | 'expired-needs-reverification'
  | 'duplicate-or-fake'
  | 'ineligible-probationary-or-trainee';

export const REP_STATUS_LABELS: Record<RepVerificationStatus, string> = {
  'enquiry-received': 'Enquiry received',
  'verification-link-sent': 'Verification link sent',
  'verification-submitted': 'Verification submitted',
  'awaiting-evidence': 'Awaiting evidence',
  'evidence-received': 'Evidence received',
  'verified-psras': 'Verified — PSRAS accredited',
  'verified-duty-solicitor': 'Verified — duty solicitor',
  'verified-solicitor': 'Verified — solicitor',
  'rejected': 'Rejected',
  'suspended': 'Suspended',
  'removed': 'Removed',
  'expired-needs-reverification': 'Expired — re-verification required',
  'duplicate-or-fake': 'Duplicate / suspected fake',
  'ineligible-probationary-or-trainee':
    'Ineligible — probationary / trainee / unaccredited',
};

export const PUBLIC_VERIFIED_STATUSES: ReadonlySet<RepVerificationStatus> = new Set([
  'verified-psras',
  'verified-duty-solicitor',
  'verified-solicitor',
]);

export type PublicVerifiedStatus = Extract<
  RepVerificationStatus,
  'verified-psras' | 'verified-duty-solicitor' | 'verified-solicitor'
>;

/**
 * The only professional categories a person may declare in either the public
 * enquiry form or the secure verification form. The site explicitly does not
 * accept probationary, trainee, "studying", "working towards accreditation",
 * "awaiting accreditation", "student" or any unaccredited category.
 */
export type ApplicantCategory = 'psras-accredited' | 'duty-solicitor' | 'solicitor';

export const APPLICANT_CATEGORY_LABELS: Record<ApplicantCategory, string> = {
  'psras-accredited': 'Fully accredited PSRAS police station representative',
  'duty-solicitor': 'Duty solicitor',
  'solicitor': 'Solicitor',
};

export const APPLICANT_CATEGORY_VALUES: ApplicantCategory[] = [
  'psras-accredited',
  'duty-solicitor',
  'solicitor',
];

/** Statuses that disqualify a profile from ever being shown publicly. */
export const NEVER_PUBLIC_STATUSES: ReadonlySet<RepVerificationStatus> = new Set([
  'enquiry-received',
  'verification-link-sent',
  'verification-submitted',
  'awaiting-evidence',
  'evidence-received',
  'rejected',
  'suspended',
  'removed',
  'expired-needs-reverification',
  'duplicate-or-fake',
  'ineligible-probationary-or-trainee',
]);

/** Default re-verification window from when a profile was last verified. */
export const REVERIFICATION_WINDOW_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

export interface RepGateInput {
  status?: RepVerificationStatus | null;
  adminApproved?: boolean | null;
  isPublic?: boolean | null;
  lastVerifiedDate?: string | null;
}

/**
 * Hard publication rule. A profile may only appear publicly when ALL of these
 * are true:
 *   - `status` is one of the three verified public statuses;
 *   - `adminApproved === true`;
 *   - `isPublic === true`;
 *   - `lastVerifiedDate` exists AND is not older than the re-verification window.
 */
export function isPubliclyVisible(input: RepGateInput): boolean {
  if (!input.status) return false;
  if (!PUBLIC_VERIFIED_STATUSES.has(input.status as PublicVerifiedStatus)) return false;
  if (input.adminApproved !== true) return false;
  if (input.isPublic !== true) return false;
  if (!input.lastVerifiedDate) return false;
  const t = Date.parse(input.lastVerifiedDate);
  if (!Number.isFinite(t)) return false;
  if (Date.now() - t > REVERIFICATION_WINDOW_MS) return false;
  return true;
}

/**
 * Best-effort detection of probationary / trainee / unaccredited terminology
 * inside a free-text accreditation, notes or status field. Used to flag
 * existing rows that pre-date the new strict categories.
 */
const INELIGIBLE_TERMS = [
  'probation',
  'probationary',
  'trainee',
  'studying',
  'student',
  'working towards',
  'working-towards',
  'awaiting accreditation',
  'awaiting-accreditation',
  'unaccredited',
  'pre-accreditation',
  'pre accreditation',
  'cit candidate',
  'cit-candidate',
];

export function looksIneligible(...fields: Array<string | undefined | null>): boolean {
  const blob = fields.filter(Boolean).join(' ').toLowerCase();
  if (!blob) return false;
  return INELIGIBLE_TERMS.some((t) => blob.includes(t));
}

/**
 * Heuristic mapper from a free-text accreditation string (used by legacy reps)
 * to one of the strict applicant categories, or `null` if it cannot be inferred.
 */
export function inferApplicantCategory(
  accreditation: string | undefined | null,
): ApplicantCategory | null {
  const a = (accreditation || '').toLowerCase();
  if (!a) return null;
  if (looksIneligible(a)) return null;
  if (a.includes('duty')) return 'duty-solicitor';
  if (a.includes('solicitor')) return 'solicitor';
  if (a.includes('psras') || a.includes('accredited rep') || a.includes('police station rep'))
    return 'psras-accredited';
  return null;
}
