import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { runFirmOutreachPipeline } from '@/lib/firm-outreach/run-pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/** @deprecated Prefer /api/cron/firm-outreach-pipeline — kept for backwards compatibility. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runFirmOutreachPipeline({ skipSend: true, skipDigest: true });
  return NextResponse.json({ ok: true, ...result });
}
