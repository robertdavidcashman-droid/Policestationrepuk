import { NextResponse } from 'next/server';
import { sendBufferSchedulerFailureEmail } from '@/lib/buffer/email';
import { runRepukBufferScheduler } from '@/lib/buffer/engine-run';
import { isCronAuthorized } from '@/lib/cron-auth';
import { localDateInTimezone } from '@/lib/buffer/scheduler-core';
import { getSchedulerTimezone } from '@/lib/buffer/config';
import {
  logSchedulerLifecycle,
  shouldSendSchedulerFailureEmail,
  shouldSendSchedulerFailureForError,
  shouldSendSchedulerSkippedEmail,
} from '@/lib/buffer/notification-policy';
import {
  markSchedulerFailureEmailSent,
  schedulerFailureErrorKey,
  wasSchedulerFailureEmailSent,
} from '@/lib/buffer/scheduler-notification-digest';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Daily Buffer blog scheduler for policestationrepuk.org (RepUK KV run).
 * Schedules posts at random day/night times (Europe/London by default).
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
    const result = await runRepukBufferScheduler({ force });

    logSchedulerLifecycle('cron_complete', {
      date: result.date ?? scheduleDate,
      ok: result.ok,
      skipped: result.skipped ?? false,
      reconciled: result.reconciled ?? false,
      scheduledInBuffer: result.scheduledInBuffer,
      reason: result.reason,
      postCount: result.posts?.length ?? 0,
    });

    if (!result.ok && shouldSendSchedulerFailureEmail(result)) {
      const error = result.reason ?? 'Buffer scheduler failed';
      const errorKey = schedulerFailureErrorKey(error);
      const date = result.date ?? scheduleDate;

      if (!(await wasSchedulerFailureEmailSent(date, errorKey))) {
        await sendBufferSchedulerFailureEmail({ error, date });
        await markSchedulerFailureEmailSent(date, errorKey);
      } else {
        console.warn(
          `[cron:buffer-blog-posts] Failure email suppressed (already sent for ${date}:${errorKey})`,
        );
      }

      return NextResponse.json({ ok: false, error, gbpIssues: result.gbpIssues });
    }

    if (result.skipped) {
      console.info(
        `[cron:buffer-blog-posts] Skipped for ${result.date ?? scheduleDate}: ${result.reason ?? 'already scheduled'}` +
          (result.reconciled ? ` (reconciled: ${result.scheduledInBuffer} in Buffer)` : ''),
      );
      if (shouldSendSchedulerSkippedEmail(result)) {
        // Intentionally disabled — benign skips are logged only to avoid contradictory emails.
      }
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

    if (shouldSendSchedulerFailureForError(error)) {
      const errorKey = schedulerFailureErrorKey(error);
      if (!(await wasSchedulerFailureEmailSent(scheduleDate, errorKey))) {
        await sendBufferSchedulerFailureEmail({ error, date: scheduleDate, partialPosts });
        await markSchedulerFailureEmailSent(scheduleDate, errorKey);
      }
    }

    return NextResponse.json({ ok: false, error }, { status: 500 });
  }
}
