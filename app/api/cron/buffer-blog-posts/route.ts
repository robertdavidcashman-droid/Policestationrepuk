import { NextResponse } from 'next/server';
import { sendBufferSchedulerFailureEmail, sendBufferSchedulerSkippedEmail } from '@/lib/buffer/email';
import { runBufferBlogScheduler } from '@/lib/buffer/scheduler';
import { isCronAuthorized } from '@/lib/cron-auth';
import { localDateInTimezone } from '@/lib/buffer/scheduler-core';
import { getSchedulerTimezone } from '@/lib/buffer/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Daily Buffer blog scheduler — schedules posts from all configured content feeds
 * (policestationrepuk, custodynote, policestationagent, psrtrain by default) with
 * hero images at random day/night times (Europe/London by default).
 *
 * Auth: Bearer ${CRON_SECRET} (Vercel Cron) or x-cron-secret in development.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scheduleDate = localDateInTimezone(new Date(), getSchedulerTimezone());
  const force = new URL(request.url).searchParams.get('force') === '1';

  try {
    const result = await runBufferBlogScheduler(new Date(), { force });
    if (!result.ok) {
      const error = result.reason ?? 'Buffer scheduler failed';
      await sendBufferSchedulerFailureEmail({ error, date: result.date ?? scheduleDate });
      return NextResponse.json(
        { ok: false, error, gbpIssues: result.gbpIssues },
      );
    }
    if (result.skipped) {
      console.warn(
        `[cron:buffer-blog-posts] Skipped for ${result.date ?? scheduleDate}: ${result.reason ?? 'already scheduled'}`,
      );
      await sendBufferSchedulerSkippedEmail({
        reason: result.reason ?? 'Already scheduled for this date',
        date: result.date ?? scheduleDate,
        postCount: result.posts?.length ?? 0,
      });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron:buffer-blog-posts]', err);
    const error = err instanceof Error ? err.message : 'Buffer scheduler failed';
    const partialPosts =
      err instanceof Error && 'partialPosts' in err
        ? (err as Error & { partialPosts?: Array<{ slug: string; channelService: string; dueAt: string | null }> })
            .partialPosts
        : undefined;
    await sendBufferSchedulerFailureEmail({ error, date: scheduleDate, partialPosts });
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
