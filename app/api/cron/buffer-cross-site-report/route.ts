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
import { withAutomationJob } from '@/lib/automation/with-job';
import { isDailyHealthcheckOwningReports } from '@/lib/automation/job-registry';
import {
  buildIncidentFingerprint,
  notifyIncident,
} from '@/lib/automation/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cross-site Buffer publish inspection.
 * When DAILY_HEALTHCHECK_ENABLED, success/failure emails are suppressed in favour
 * of the consolidated daily automation report (incidents still recorded in the ledger).
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
  const healthcheckOwns = isDailyHealthcheckOwningReports();

  if (!force && !healthcheckOwns && (await wasCrossSiteDigestSent(verifyDate))) {
    return NextResponse.json({ ok: true, skipped: true, date: verifyDate });
  }

  const wrapped = await withAutomationJob({
    jobName: 'buffer-cross-site-report',
    triggerSource: 'cron',
    run: async ({ executionId }) => {
      const report = await verifyCrossSiteBufferPosts({
        date: url.searchParams.get('date')?.trim() || undefined,
      });

      if (report.reason === 'missing_api_key') {
        if (healthcheckOwns) {
          await notifyIncident({
            fingerprint: buildIncidentFingerprint({
              jobName: 'buffer-cross-site-report',
              category: 'config',
              scheduledDate: verifyDate,
            }),
            notificationType: 'cross_site_failure',
            jobName: 'buffer-cross-site-report',
            severity: 'critical',
            summary: 'BUFFER_API_KEY is not configured.',
            category: 'config',
            executionId,
          });
        } else {
          await sendBufferCrossSiteFailureEmail({
            date: verifyDate,
            sites: [],
            reason: 'BUFFER_API_KEY is not configured.',
          });
          await markCrossSiteDigestSent(verifyDate);
        }
        return {
          status: 'requires_human_action' as const,
          result: { ok: false, date: verifyDate, reason: report.reason },
          errorMessage: 'BUFFER_API_KEY is not configured.',
        };
      }

      if (report.ok) {
        if (!healthcheckOwns) {
          await sendBufferCrossSiteSuccessEmail({
            date: report.date,
            sites: report.sites,
          });
          await markCrossSiteDigestSent(verifyDate);
        }
        return {
          status: 'successful' as const,
          result: {
            ok: true,
            date: report.date,
            sites: report.sites,
            emailSuppressed: healthcheckOwns,
          },
          counts: {
            quotaExpected: report.sites.reduce((s, x) => s + x.requiredCount, 0),
            quotaAchieved: report.sites.reduce((s, x) => s + x.sentCount, 0),
          },
        };
      }

      if (healthcheckOwns) {
        for (const site of report.problems) {
          await notifyIncident({
            fingerprint: buildIncidentFingerprint({
              jobName: 'buffer-cross-site-report',
              category: 'quota_supply',
              accountOrDestination: site.id,
              scheduledDate: report.date,
            }),
            notificationType: 'cross_site_deficit',
            jobName: 'buffer-cross-site-report',
            severity: 'error',
            summary: `${site.hostname} under quota: ${site.sentCount}/${site.requiredCount}`,
            category: 'quota_supply',
            executionId,
            dryRun: true,
          });
        }
      } else {
        await sendBufferCrossSiteFailureEmail({
          date: report.date,
          sites: report.sites,
          feedBreakdown: report.feedBreakdown,
        });
        await markCrossSiteDigestSent(verifyDate);
      }

      return {
        status: 'partially_successful' as const,
        result: {
          ok: false,
          date: report.date,
          sites: report.sites,
          problems: report.problems,
          emailSuppressed: healthcheckOwns,
        },
        counts: {
          quotaExpected: report.sites.reduce((s, x) => s + x.requiredCount, 0),
          quotaAchieved: report.sites.reduce((s, x) => s + x.sentCount, 0),
        },
        errorMessage: `${report.problems.length} sites under quota`,
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

  if (!wrapped.result) {
    console.error('[cron:buffer-cross-site-report]', wrapped.reason);
    return NextResponse.json({ ok: false, error: wrapped.reason }, { status: 500 });
  }

  return NextResponse.json(wrapped.result, { status: 200 });
}
