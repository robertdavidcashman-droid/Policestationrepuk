import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import {
  crossSiteDigestVerifyDate,
  markCrossSiteDigestSent,
  wasCrossSiteDigestSent,
} from '@/lib/buffer/cross-site-digest';
import {
  sendBufferCrossSiteFailureEmail,
  sendBufferCrossSiteSuccessEmail,
} from '@/lib/buffer/email';
import { verifyCrossSiteBufferPosts } from '@/lib/buffer/verify-cross-site';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cross-site Buffer publish report — verifies yesterday's sent posts per hostname
 * across all four properties in the shared workspace.
 *
 * Schedule: 04:45 UTC (after REPUK daily report at 04:30).
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get('force') === '1';
  const verifyDate = url.searchParams.get('date')?.trim() || crossSiteDigestVerifyDate();

  if (!force && (await wasCrossSiteDigestSent(verifyDate))) {
    return NextResponse.json({ ok: true, skipped: true, date: verifyDate });
  }

  try {
    const report = await verifyCrossSiteBufferPosts({
      date: url.searchParams.get('date')?.trim() || undefined,
    });

    if (report.reason === 'missing_api_key') {
      await sendBufferCrossSiteFailureEmail({
        date: verifyDate,
        sites: [],
        reason: 'BUFFER_API_KEY is not configured.',
      });
      await markCrossSiteDigestSent(verifyDate);
      return NextResponse.json({ ok: false, date: verifyDate, reason: report.reason });
    }

    if (report.ok) {
      await sendBufferCrossSiteSuccessEmail({
        date: report.date,
        sites: report.sites,
      });
      await markCrossSiteDigestSent(verifyDate);
      return NextResponse.json({
        ok: true,
        date: report.date,
        sites: report.sites,
      });
    }

    await sendBufferCrossSiteFailureEmail({
      date: report.date,
      sites: report.sites,
    });
    await markCrossSiteDigestSent(verifyDate);
    return NextResponse.json(
      {
        ok: false,
        date: report.date,
        sites: report.sites,
        problems: report.problems,
      },
      { status: 200 },
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Cross-site Buffer report failed';
    console.error('[cron:buffer-cross-site-report]', err);
    await sendBufferCrossSiteFailureEmail({
      date: verifyDate,
      sites: [],
      reason: error,
    });
    await markCrossSiteDigestSent(verifyDate);
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
