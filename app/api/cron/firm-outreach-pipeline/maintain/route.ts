import { NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';
import { recoverEnrichPool } from '@/lib/firm-outreach/enrichment/recover-enrich-pool';
import { requeueNoEmailProspects } from '@/lib/firm-outreach/enrichment/requeue-no-email';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '@/lib/firm-outreach/campaign-scope';
import { FIRM_OUTREACH_CAMPAIGN_ID } from '@/lib/firm-outreach/site-config';
import { runFirmOutreachPipeline } from '@/lib/firm-outreach/run-pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

function isSundayUtc(): boolean {
  return new Date().getUTCDay() === 0;
}

/** Nightly: LAA refresh (if stale) + DSCC + discovery — no sends. Sunday: requeue no_email for retry. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requeue = isSundayUtc() ? await requeueNoEmailProspects() : { requeued: 0 };
  const enrichPoolRecovery = {
    whatsapp_invite_v1: await recoverEnrichPool({ campaignId: FIRM_OUTREACH_CAMPAIGN_ID }),
    agent_cover_kent_v1: await recoverEnrichPool({ campaignId: AGENT_COVER_KENT_CAMPAIGN_ID }),
  };

  const result = await runFirmOutreachPipeline({
    skipSend: true,
    skipDigest: true,
    skipEnrich: true,
    forceLaaRefresh: false,
  });

  return NextResponse.json({
    ok: true,
    mode: 'maintain',
    requeue,
    enrichPoolRecovery,
    ...result,
  });
}
