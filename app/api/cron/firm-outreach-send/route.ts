import { NextResponse } from 'next/server';
import { validateOutreachEnv } from '@robertcashman/firm-outreach-core';
import { isCronAuthorized } from '@/lib/cron-auth';
import { cronSendBatchSize, outreachRequireApproval } from '@/lib/firm-outreach/constants';
import { runFirmOutreachPipeline } from '@/lib/firm-outreach/run-pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/** Send-only cron tick (no enrich, no owner digest). */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Click-to-send mode: only the approval Confirm path may send firm emails.
  if (outreachRequireApproval()) {
    return NextResponse.json({
      ok: true,
      mode: 'approval-required',
      skipped: true,
      reason: 'FIRM_OUTREACH_REQUIRE_APPROVAL=true — use Ready to send approval link',
    });
  }

  const envCheck = validateOutreachEnv({ requireCronSecret: true });
  if (!envCheck.ok) {
    return NextResponse.json(
      { ok: false, error: 'outreach_env_invalid', errors: envCheck.errors, warnings: envCheck.warnings },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const paramLimit = Number(url.searchParams.get('limit') || 0);
  const sendLimit = paramLimit > 0 ? paramLimit : cronSendBatchSize();
  const result = await runFirmOutreachPipeline({
    skipDiscovery: true,
    skipEnrich: true,
    skipDigest: true,
    skipCleanup: true,
    skipCounts: true,
    sendLimit,
  });
  return NextResponse.json({
    ok: true,
    mode: 'send-only',
    warnings: envCheck.warnings,
    ...result,
  });
}
