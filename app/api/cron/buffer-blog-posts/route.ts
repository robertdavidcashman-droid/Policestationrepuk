import { NextResponse } from 'next/server';
import { sendBufferSchedulerFailureEmail } from '@/lib/buffer/email';
import { runBufferBlogScheduler } from '@/lib/buffer/scheduler';
import { isCronAuthorized } from '@/lib/cron-auth';
import { localDateInTimezone } from '@/lib/buffer/scheduler-core';
import { getSchedulerTimezone } from '@/lib/buffer/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Daily Buffer blog scheduler — picks 3 random policestationrepuk.org blog posts
 * and schedules them at random times today (Europe/London by default).
 *
 * Auth: Bearer ${CRON_SECRET} (Vercel Cron) or x-cron-secret in development.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scheduleDate = localDateInTimezone(new Date(), getSchedulerTimezone());

  try {
    const result = await runBufferBlogScheduler();
    if (!result.ok) {
      const error = result.reason ?? 'Buffer scheduler failed';
      await sendBufferSchedulerFailureEmail({ error, date: result.date ?? scheduleDate });
      return NextResponse.json({ ok: false, error }, { status: 500 });
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
