import { NextResponse } from 'next/server';
import { loadAllReviews, setReview } from '@/lib/admin-review';
import { REVERIFICATION_WINDOW_MS } from '@/lib/rep-status';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Daily sweep: any rep whose `lastVerifiedDate` is older than the
 * re-verification window (default 12 months) is automatically flipped to
 * `expired-needs-reverification` and hidden from the public directory.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron sets this
 * automatically when the path is registered in `vercel.json` with a secret).
 * In development the route also accepts an `x-cron-secret` header so it can
 * be smoke-tested with curl.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reviews = await loadAllReviews();
  const now = Date.now();
  const cutoff = now - REVERIFICATION_WINDOW_MS;
  const swept: string[] = [];
  const skipped: string[] = [];

  for (const [email, review] of reviews.entries()) {
    if (!review.lastVerifiedDate) continue;
    const ts = Date.parse(review.lastVerifiedDate);
    if (!Number.isFinite(ts)) continue;
    if (ts >= cutoff) continue;
    if (review.verificationStatus === 'expired-needs-reverification') {
      skipped.push(email);
      continue;
    }
    try {
      await setReview(
        email,
        {
          verificationStatus: 'expired-needs-reverification',
          adminApproved: false,
          isPublic: false,
          riskCategory: review.riskCategory ?? null,
          riskReasons: review.riskReasons ?? [],
          adminNotes:
            (review.adminNotes ? review.adminNotes + '\n' : '') +
            `[${new Date(now).toISOString()}] auto-expired by reverification-sweep (last verified ${review.lastVerifiedDate}).`,
        },
        'cron:reverification-sweep',
      );
      swept.push(email);
    } catch (err) {
      console.warn('[reverification-sweep] failed for', email, err);
    }
  }

  return NextResponse.json({
    ok: true,
    now: new Date(now).toISOString(),
    cutoff: new Date(cutoff).toISOString(),
    sweptCount: swept.length,
    skippedCount: skipped.length,
    swept,
  });
}
