import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { runFirmOutreachPipeline } from '@/lib/firm-outreach/run-pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/** @deprecated Prefer /api/cron/firm-outreach-pipeline */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const enrichLimit = Number(url.searchParams.get('limit') || 0) || undefined;
  const result = await runFirmOutreachPipeline({
    skipSend: true,
    enrichLimit,
    skipDigest: true,
  });
  return NextResponse.json({ ok: true, ...result });
}
