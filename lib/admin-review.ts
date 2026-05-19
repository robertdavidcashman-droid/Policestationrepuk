import { getKV, skipKVInPrerender } from '@/lib/kv';

export type RepReviewStatus = 'pending' | 'approved' | 'flagged' | 'rejected';

export interface RepReview {
  email: string;
  status: RepReviewStatus;
  adminNotes: string;
  lastReviewedAt: string;
  reviewedBy: string;
}

const REVIEW_STATUSES: ReadonlySet<RepReviewStatus> = new Set([
  'pending',
  'approved',
  'flagged',
  'rejected',
]);

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

export async function setReview(
  email: string,
  partial: { status?: RepReviewStatus; adminNotes?: string },
  reviewer: string,
): Promise<RepReview> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  const lower = email.toLowerCase();
  const existing = (await kv.get<RepReview>(reviewKey(lower))) ?? null;

  let status: RepReviewStatus = existing?.status ?? 'pending';
  if (partial.status) {
    if (!REVIEW_STATUSES.has(partial.status)) {
      throw new Error(`Invalid review status: ${partial.status}`);
    }
    status = partial.status;
  }

  const adminNotes = typeof partial.adminNotes === 'string'
    ? partial.adminNotes.slice(0, 5000)
    : existing?.adminNotes ?? '';

  const record: RepReview = {
    email: lower,
    status,
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
  return typeof value === 'string' && REVIEW_STATUSES.has(value as RepReviewStatus);
}
