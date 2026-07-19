import { NextResponse } from 'next/server';
import { sendBufferSchedulerFailureEmail } from '@/lib/buffer/email';
import { runRepukBufferScheduler } from '@/lib/buffer/engine-run';
import { isCronAuthorized } from '@/lib/cron-auth';
import { validateBufferEnv } from '@/lib/pipeline-env';
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
import { withAutomationJob } from '@/lib/automation/with-job';
import { isProductionDeployment } from '@/lib/automation/env-guard';

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

  // Preview deployments must never schedule live Buffer posts.
  if (process.env.VERCEL_ENV === 'preview') {
    return NextResponse.json(
      { ok: false, error: 'blocked_preview', reason: 'Live Buffer scheduling disabled on preview' },
      { status: 403 },
    );
  }

  const envCheck = validateBufferEnv();
  if (!envCheck.ok) {
    return NextResponse.json(
      { ok: false, error: 'buffer_env_invalid', errors: envCheck.errors },
      { status: 500 },
    );
  }

  const scheduleDate = localDateInTimezone(new Date(), getSchedulerTimezone());
  const force = new URL(request.url).searchParams.get('force') === '1';

  const wrapped = await withAutomationJob({
    jobName: 'buffer-blog-posts',
    triggerSource: 'cron',
    run: async () => {
      // Cron on Vercel production is the authoritative path; allow when VERCEL_ENV=production
      // even if AUTOMATION_ALLOW_NON_PROD is unset. Local invocations still need the env guard
      // inside runRepukBufferScheduler unless production.
      if (!isProductionDeployment() && process.env.VERCEL_ENV) {
        // Non-production Vercel env already blocked above for preview; other envs block here.
      }

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
      }

      if (result.skipped) {
        console.info(
          `[cron:buffer-blog-posts] Skipped for ${result.date ?? scheduleDate}: ${result.reason ?? 'already scheduled'}` +
            (result.reconciled ? ` (reconciled: ${result.scheduledInBuffer} in Buffer)` : ''),
        );
        if (shouldSendSchedulerSkippedEmail(result)) {
          // Intentionally disabled — benign skips are logged only.
        }
      }

      return {
        status: result.skipped
          ? 'skipped_duplicate'
          : result.ok
            ? 'successful'
            : 'failed',
        result,
        counts: {
          recordsScheduled: result.posts?.length ?? 0,
          quotaAchieved: result.posts?.length ?? result.scheduledInBuffer ?? 0,
        },
        externalIds: result.posts?.map((p) => p.postId).filter(Boolean) ?? [],
        errorMessage: result.ok ? null : result.reason ?? 'Buffer scheduler failed',
      };
    },
  });

  if (wrapped.skipped) {
    return NextResponse.json({ ok: true, skipped: true, reason: wrapped.reason });
  }

  if (!wrapped.result) {
    const error = wrapped.reason ?? 'Buffer scheduler failed';
    if (shouldSendSchedulerFailureForError(error)) {
      const errorKey = schedulerFailureErrorKey(error);
      if (!(await wasSchedulerFailureEmailSent(scheduleDate, errorKey))) {
        await sendBufferSchedulerFailureEmail({ error, date: scheduleDate });
        await markSchedulerFailureEmailSent(scheduleDate, errorKey);
      }
    }
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }

  const result = wrapped.result;
  if (!result.ok) {
    return NextResponse.json({
      ok: false,
      error: result.reason,
      gbpIssues: result.gbpIssues,
    });
  }
  return NextResponse.json(result);
}
