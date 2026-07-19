import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import {
  bufferDigestVerifyDate,
  claimBufferDigest,
  markBufferDigestSent,
  wasBufferDigestSent,
} from '@/lib/buffer/daily-digest';
import {
  sendBufferDailyFailureEmail,
  sendBufferDailySuccessEmail,
} from '@/lib/buffer/email';
import { verifyBufferPostsPublished } from '@/lib/buffer/verify-posted';
import { withAutomationJob } from '@/lib/automation/with-job';
import { isDailyHealthcheckOwningReports } from '@/lib/automation/job-registry';
import {
  buildIncidentFingerprint,
  notifyIncident,
} from '@/lib/automation/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Daily Buffer publish inspection — verifies yesterday's London scheduler run.
 * When DAILY_HEALTHCHECK_ENABLED, success emails are suppressed (consolidated report owns them).
 * Permanent config failures still record an incident for the healthcheck/ledger.
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
  const healthcheckOwns = isDailyHealthcheckOwningReports();

  if (!force && !healthcheckOwns) {
    if (await wasBufferDigestSent(verifyDate)) {
      return NextResponse.json({ ok: true, skipped: true, date: verifyDate });
    }
    if (!(await claimBufferDigest(verifyDate))) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        date: verifyDate,
        reason: 'concurrent_digest',
      });
    }
  }

  const wrapped = await withAutomationJob<Record<string, unknown>>({
    jobName: 'buffer-daily-report',
    triggerSource: 'cron',
    run: async ({ executionId }) => {
      const report = await verifyBufferPostsPublished(verifyDate);

      if (report.reason === 'no_run' || report.reason === 'missing_api_key') {
        const reason =
          report.reason === 'no_run'
            ? 'No scheduler run recorded in KV for this date.'
            : 'BUFFER_API_KEY is not configured.';

        if (healthcheckOwns) {
          await notifyIncident({
            fingerprint: buildIncidentFingerprint({
              jobName: 'buffer-daily-report',
              category: report.reason === 'missing_api_key' ? 'config' : 'scheduler',
              scheduledDate: verifyDate,
            }),
            notificationType: 'buffer_daily_failure',
            jobName: 'buffer-daily-report',
            severity: report.reason === 'missing_api_key' ? 'critical' : 'error',
            summary: reason,
            category: report.reason === 'missing_api_key' ? 'config' : 'scheduler',
            executionId,
            // Healthcheck sends the consolidated report; only permanent config alerts immediately.
            dryRun: report.reason !== 'missing_api_key',
          });
        } else {
          await sendBufferDailyFailureEmail({
            date: verifyDate,
            total: report.total,
            failed: report.total,
            reason,
            problems: [],
          });
          await markBufferDigestSent(verifyDate);
        }

        return {
          status: report.reason === 'missing_api_key' ? 'requires_human_action' : 'failed',
          result: { ok: false, date: verifyDate, reason: report.reason },
          errorMessage: reason,
          counts: { quotaExpected: report.total, quotaAchieved: 0 },
        };
      }

      if (report.ok) {
        if (!healthcheckOwns) {
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
        }
        return {
          status: 'successful',
          result: {
            ok: true,
            date: verifyDate,
            total: report.total,
            sent: report.sent,
            feedCounts: report.feedCounts,
            emailSuppressed: healthcheckOwns,
          },
          counts: {
            quotaExpected: report.total,
            quotaAchieved: report.sent,
          },
        };
      }

      if (healthcheckOwns) {
        await notifyIncident({
          fingerprint: buildIncidentFingerprint({
            jobName: 'buffer-daily-report',
            category: 'scheduler',
            scheduledDate: verifyDate,
          }),
          notificationType: 'buffer_daily_failure',
          jobName: 'buffer-daily-report',
          severity: 'error',
          summary: `Buffer posts not all sent — ${verifyDate} (${report.failed} failed)`,
          category: 'scheduler',
          executionId,
          dryRun: true, // consolidated into daily health report
        });
      } else {
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
      }

      return {
        status: 'partially_successful',
        result: {
          ok: false,
          date: verifyDate,
          total: report.total,
          sent: report.sent,
          failed: report.failed,
          problems: report.problems,
          emailSuppressed: healthcheckOwns,
        },
        counts: {
          quotaExpected: report.total,
          quotaAchieved: report.sent,
        },
        errorMessage: `${report.failed} posts failed`,
      };
    },
  });

  if (wrapped.skipped) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      date: verifyDate,
      reason: wrapped.reason,
    });
  }

  if (!wrapped.ok && wrapped.reason && !wrapped.result) {
    console.error('[cron:buffer-daily-report]', wrapped.reason);
    return NextResponse.json({ ok: false, error: wrapped.reason }, { status: 500 });
  }

  return NextResponse.json(wrapped.result);
}
