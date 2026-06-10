import { NextResponse } from 'next/server';
import { sendBufferHealthFailureEmail } from '@/lib/buffer/email';
import { verifyScheduledBufferImages } from '@/lib/buffer/verify-scheduled';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Weekly GBP scheduled-image health check — emails on Google Business failures only.
 * Auth: Bearer ${CRON_SECRET} (Vercel Cron) or x-cron-secret in development.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await verifyScheduledBufferImages({ googleBusinessOnly: true });

    if (!result.ok) {
      await sendBufferHealthFailureEmail({
        date: result.date,
        issueCount: result.issueCount,
        issues: result.issues,
      });
      return NextResponse.json(
        {
          ok: false,
          mode: result.mode,
          issueCount: result.issueCount,
          issues: result.issues,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      mode: result.mode,
      scheduledCount: result.scheduledCount,
      googleBusinessPosts: result.googleBusinessPosts,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Buffer health check failed';
    console.error('[cron:buffer-health]', err);
    await sendBufferHealthFailureEmail({
      issueCount: 1,
      issues: [{ issue: error }],
    });
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
