import { NextResponse } from 'next/server';
import { validateOutreachEnv } from '@robertcashman/firm-outreach-core';
import { isOutreachBootstrapAuthorized } from '@/lib/cron-auth';
import { outreachRequireApproval } from '@/lib/firm-outreach/constants';
import { getOutreachConfigStatus } from '@/lib/firm-outreach/config-status';
import { countEmailJobsByStatus } from '@/lib/firm-outreach/email-jobs/storage';
import { selectOutreachCandidates } from '@/lib/firm-outreach/outreach/candidate-selection';
import { buildOutreachActivityReport } from '@/lib/firm-outreach/outreach/activity-report';
import { getLatestOutreachRunLog } from '@/lib/firm-outreach/storage';
import { OUTREACH_CAMPAIGN_IDS } from '@/lib/firm-outreach/site-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Outreach health — config, pause state, queue, and durable job summary. */
export async function GET(request: Request) {
  if (!isOutreachBootstrapAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const envCheck = validateOutreachEnv();
  const config = await getOutreachConfigStatus();
  const { report } = await buildOutreachActivityReport();
  const jobCounts = await countEmailJobsByStatus();

  const eligibility: Record<
    string,
    {
      readyScanned: number;
      readyEligible: number;
      followUpEligible: number;
      lastRun?: unknown;
    }
  > = {};

  for (const campaignId of OUTREACH_CAMPAIGN_IDS) {
    const selection = await selectOutreachCandidates({
      campaignId,
      readyLimit: 500,
      sentLimit: 200,
    });
    eligibility[campaignId] = {
      readyScanned: selection.readyScanned,
      readyEligible: selection.readyEligible,
      followUpEligible: selection.followUpEligible,
      lastRun: await getLatestOutreachRunLog(campaignId),
    };
  }

  const pendingJobs = jobCounts.pending ?? 0;
  const processingJobs =
    (jobCounts.claimed ?? 0) + (jobCounts.processing ?? 0);
  const retryJobs = jobCounts.retry_scheduled ?? 0;
  const permanentlyFailed = jobCounts.permanently_failed ?? 0;

  return NextResponse.json({
    ok:
      config.kvConfigured &&
      config.resendConfigured &&
      config.outreachEnabled &&
      config.sendHealthy !== false &&
      envCheck.ok,
    date: new Date().toISOString().slice(0, 10),
    config: {
      ...config,
      requireApproval: outreachRequireApproval(),
      dryRun: envCheck.dryRun,
      envErrors: envCheck.errors,
      envWarnings: envCheck.warnings,
    },
    queue: {
      readyToSend: report.summary.readyToSend,
      sendableReady: report.readyToSendProspects.filter((r) => !r.suppressed && r.email).length,
      sentToday: report.summary.sentToday,
      sentLast7Days: report.summary.sentLast7Days,
      /** Truly due for a send step (excludes not-due sent / stale ready). */
      eligibility,
    },
    jobs: {
      pending: pendingJobs,
      processing: processingJobs,
      retryScheduled: retryJobs,
      accepted: jobCounts.accepted ?? 0,
      delivered: jobCounts.delivered ?? 0,
      bounced: jobCounts.bounced ?? 0,
      complained: jobCounts.complained ?? 0,
      permanentlyFailed,
      byStatus: jobCounts,
    },
  });
}
