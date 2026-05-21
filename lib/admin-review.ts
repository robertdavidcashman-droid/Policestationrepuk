import { getKV, skipKVInPrerender } from '@/lib/kv';
import type { RepVerificationStatus } from '@/lib/rep-status';
import {
  NEVER_PUBLIC_STATUSES,
  PUBLIC_VERIFIED_STATUSES,
  REP_STATUS_LABELS,
} from '@/lib/rep-status';

/**
 * Legacy 4-state value used by the original admin UI. New code should prefer
 * `RepVerificationStatus`. Kept for backwards compatibility with existing
 * `repreview:{email}` rows in KV.
 */
export type RepReviewStatus = 'pending' | 'approved' | 'flagged' | 'rejected';

const LEGACY_REVIEW_STATUSES: ReadonlySet<RepReviewStatus> = new Set([
  'pending',
  'approved',
  'flagged',
  'rejected',
]);

const ALL_VERIFICATION_STATUSES: ReadonlySet<RepVerificationStatus> = new Set(
  Object.keys(REP_STATUS_LABELS) as RepVerificationStatus[],
);

export interface RepReview {
  email: string;
  status: RepReviewStatus;
  /** New canonical status (see lib/rep-status.ts). */
  verificationStatus?: RepVerificationStatus | null;
  /** Manual admin approval flag — required for public visibility. */
  adminApproved?: boolean | null;
  isPublic?: boolean | null;
  lastVerifiedDate?: string | null;
  /** Set when this profile was scored as Reject / Ineligible / High by the auditor. */
  riskCategory?: string | null;
  riskReasons?: string[];
  adminNotes: string;
  lastReviewedAt: string;
  reviewedBy: string;
}

function reviewKey(email: string): string {
  return `repreview:${email.toLowerCase()}`;
}

export async function getReview(email: string): Promise<RepReview | null> {
  const kv = getKV();
  if (!kv) return null;
  try {
    return await kv.get<RepReview>(reviewKey(email));
  } catch (err) {
    console.error('[admin-review] getReview failed:', err);
    return null;
  }
}

export interface SetReviewInput {
  status?: RepReviewStatus;
  verificationStatus?: RepVerificationStatus | null;
  adminApproved?: boolean | null;
  isPublic?: boolean | null;
  lastVerifiedDate?: string | null;
  riskCategory?: string | null;
  riskReasons?: string[];
  adminNotes?: string;
}

export async function setReview(
  email: string,
  partial: SetReviewInput,
  reviewer: string,
): Promise<RepReview> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  const lower = email.toLowerCase();
  const existing = (await kv.get<RepReview>(reviewKey(lower))) ?? null;

  let status: RepReviewStatus = existing?.status ?? 'pending';
  if (partial.status) {
    if (!LEGACY_REVIEW_STATUSES.has(partial.status)) {
      throw new Error(`Invalid review status: ${partial.status}`);
    }
    status = partial.status;
  }

  let verificationStatus = existing?.verificationStatus ?? null;
  if ('verificationStatus' in partial) {
    const v = partial.verificationStatus;
    if (v != null && !ALL_VERIFICATION_STATUSES.has(v)) {
      throw new Error(`Invalid verification status: ${v}`);
    }
    verificationStatus = v ?? null;
    // Mirror onto the legacy enum so the old admin UI still makes sense.
    if (v && PUBLIC_VERIFIED_STATUSES.has(v as never)) status = 'approved';
    else if (v === 'rejected' || v === 'duplicate-or-fake') status = 'rejected';
    else if (
      v === 'suspended' ||
      v === 'removed' ||
      v === 'ineligible-probationary-or-trainee' ||
      v === 'expired-needs-reverification'
    ) {
      status = 'flagged';
    } else if (v) {
      status = 'pending';
    }
  }

  const adminApproved =
    'adminApproved' in partial ? partial.adminApproved ?? null : existing?.adminApproved ?? null;
  const isPublic =
    'isPublic' in partial ? partial.isPublic ?? null : existing?.isPublic ?? null;
  const lastVerifiedDate =
    'lastVerifiedDate' in partial
      ? partial.lastVerifiedDate ?? null
      : existing?.lastVerifiedDate ?? null;

  const riskCategory =
    'riskCategory' in partial ? partial.riskCategory ?? null : existing?.riskCategory ?? null;
  const riskReasons =
    'riskReasons' in partial ? partial.riskReasons ?? [] : existing?.riskReasons ?? [];

  const adminNotes =
    typeof partial.adminNotes === 'string'
      ? partial.adminNotes.slice(0, 10_000)
      : existing?.adminNotes ?? '';

  const record: RepReview = {
    email: lower,
    status,
    verificationStatus,
    adminApproved,
    isPublic,
    lastVerifiedDate,
    riskCategory,
    riskReasons,
    adminNotes,
    lastReviewedAt: new Date().toISOString(),
    reviewedBy: reviewer.toLowerCase(),
  };

  await kv.set(reviewKey(lower), record);
  return record;
}

export async function loadAllReviews(): Promise<Map<string, RepReview>> {
  const map = new Map<string, RepReview>();
  if (skipKVInPrerender()) return map;
  const kv = getKV();
  if (!kv) return map;
  try {
    const keys = await kv.keys('repreview:*');
    if (keys.length === 0) return map;
    const pipeline = kv.pipeline();
    for (const key of keys) pipeline.get(key);
    const results = await pipeline.exec<(RepReview | null)[]>();
    for (const row of results) {
      if (row && typeof row === 'object' && typeof row.email === 'string') {
        map.set(row.email.toLowerCase(), row);
      }
    }
  } catch (err) {
    console.error('[admin-review] loadAllReviews failed:', err);
  }
  return map;
}

export function isValidReviewStatus(value: unknown): value is RepReviewStatus {
  return typeof value === 'string' && LEGACY_REVIEW_STATUSES.has(value as RepReviewStatus);
}

export function isValidVerificationStatus(value: unknown): value is RepVerificationStatus {
  return typeof value === 'string' && ALL_VERIFICATION_STATUSES.has(value as RepVerificationStatus);
}

/** Returns true when the review record forbids public visibility. */
export function reviewBlocksPublication(review: RepReview | null | undefined): boolean {
  if (!review) return false;
  if (review.adminApproved === false) return true;
  if (review.isPublic === false) return true;
  if (
    review.verificationStatus &&
    NEVER_PUBLIC_STATUSES.has(review.verificationStatus)
  ) {
    return true;
  }
  // Legacy fallback
  if (review.status === 'rejected' || review.status === 'flagged') return true;
  return false;
}
