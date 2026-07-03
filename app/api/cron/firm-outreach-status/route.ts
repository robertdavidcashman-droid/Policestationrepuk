import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { outreachRequireApproval } from '@/lib/firm-outreach/constants';
import { getOutreachConfigStatus } from '@/lib/firm-outreach/config-status';
import { buildOutreachActivityReport } from '@/lib/firm-outreach/outreach/activity-report';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Outreach health — config, pause state, and queue summary for monitoring. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = await getOutreachConfigStatus();
  const { report } = await buildOutreachActivityReport();

  return NextResponse.json({
    ok: config.kvConfigured && config.resendConfigured && config.outreachEnabled,
    date: new Date().toISOString().slice(0, 10),
    config: {
      ...config,
      requireApproval: outreachRequireApproval(),
    },
    queue: {
      readyToSend: report.summary.readyToSend,
      sendableReady: report.readyToSendProspects.filter((r) => !r.suppressed && r.email).length,
      sentToday: report.summary.sentToday,
      sentLast7Days: report.summary.sentLast7Days,
    },
  });
}
