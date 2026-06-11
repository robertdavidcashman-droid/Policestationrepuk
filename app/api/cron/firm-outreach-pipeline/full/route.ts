import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { runFirmOutreachPipeline } from '@/lib/firm-outreach/run-pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/** Daily morning: send invitations from ready queue + daily digest (no enrichment). */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runFirmOutreachPipeline({
    skipDiscovery: true,
    skipEnrich: true,
  });

  return NextResponse.json({ ok: true, mode: 'send-only', ...result });
}
