import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { outreachRequireApproval } from '@/lib/firm-outreach/constants';
import { sendOutreachApprovalRequestEmail } from '@/lib/firm-outreach/outreach/approval-request-email';
import { runFirmOutreachPipeline } from '@/lib/firm-outreach/run-pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/** Daily morning: approval email with Ready to send button (or legacy auto-send if approval disabled). */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get('force') === '1';

  if (outreachRequireApproval()) {
    const pipeline = await runFirmOutreachPipeline({
      skipDiscovery: true,
      skipEnrich: true,
      skipSend: true,
      skipDigest: true,
    });
    const approval = await sendOutreachApprovalRequestEmail({ force });
    return NextResponse.json({ ok: true, mode: 'approval-only', approval, ...pipeline });
  }

  const result = await runFirmOutreachPipeline({
    skipDiscovery: true,
    skipEnrich: true,
  });

  return NextResponse.json({ ok: true, mode: 'send-only', ...result });
}
