import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import {
  bufferDigestVerifyDate,
  markBufferDigestSent,
  wasBufferDigestSent,
} from '@/lib/buffer/daily-digest';
import {
  sendBufferDailyFailureEmail,
  sendBufferDailySuccessEmail,
} from '@/lib/buffer/email';
import { verifyBufferPostsPublished } from '@/lib/buffer/verify-posted';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Daily Buffer publish report — verifies yesterday's London scheduler run
 * (including night slots) and emails success or failure once per date.
 *
 * Schedule: 04:30 UTC (after night posts through ~03:25 UTC).
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get('force') === '1';
  const dateParam = url.searchParams.get('date')?.trim();
  const verifyDate = dateParam || bufferDigestVerifyDate();

  if (!force && (await wasBufferDigestSent(verifyDate))) {
    return NextResponse.json({ ok: true, skipped: true, date: verifyDate });
  }

  try {
    const report = await verifyBufferPostsPublished(verifyDate);

    if (report.reason === 'no_run') {
      await sendBufferDailyFailureEmail({
        date: verifyDate,
        total: 0,
        failed: 0,
        reason: 'No scheduler run recorded in KV for this date.',
        problems: [],
      });
      await markBufferDigestSent(verifyDate);
      return NextResponse.json(
        { ok: false, date: verifyDate, reason: report.reason },
        { status: 500 },
      );
    }

    if (report.reason === 'missing_api_key') {
      await sendBufferDailyFailureEmail({
        date: verifyDate,
        total: report.total,
        failed: report.total,
        reason: 'BUFFER_API_KEY is not configured.',
        problems: [],
      });
      await markBufferDigestSent(verifyDate);
      return NextResponse.json(
        { ok: false, date: verifyDate, reason: report.reason },
        { status: 500 },
      );
    }

    if (report.ok) {
      await sendBufferDailySuccessEmail({
        date: verifyDate,
        total: report.total,
        sent: report.sent,
        feedCounts: report.feedCounts,
        posts: report.posts
          .filter((p) => p.status === 'sent')
          .map((p) => ({
            slug: p.slug,
            feed: p.feed,
            channelService: p.channelService,
            dueAt: p.dueAt,
          })),
      });
      await markBufferDigestSent(verifyDate);
      return NextResponse.json({
        ok: true,
        date: verifyDate,
        total: report.total,
        sent: report.sent,
        feedCounts: report.feedCounts,
      });
    }

    await sendBufferDailyFailureEmail({
      date: verifyDate,
      total: report.total,
      failed: report.failed,
      problems: report.problems.map((p) => ({
        slug: p.slug,
        feed: p.feed,
        channelService: p.channelService,
        dueAt: p.dueAt,
        status: p.status,
        issue: p.issue,
      })),
    });
    await markBufferDigestSent(verifyDate);
    return NextResponse.json(
      {
        ok: false,
        date: verifyDate,
        total: report.total,
        sent: report.sent,
        failed: report.failed,
        problems: report.problems,
      },
      { status: 500 },
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Buffer daily report failed';
    console.error('[cron:buffer-daily-report]', err);
    await sendBufferDailyFailureEmail({
      date: verifyDate,
      total: 0,
      failed: 0,
      reason: error,
      problems: [],
    });
    await markBufferDigestSent(verifyDate);
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
