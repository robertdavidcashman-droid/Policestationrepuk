#!/usr/bin/env node
/**
 * Run firm-outreach actions with production env from bash-sourced .env.vercel.production
 * (dotenv cannot parse that file due to CRLF/special chars in values).
 *
 * Usage:
 *   bash -c 'set -a; source .env.vercel.production; set +a; node scripts/firm-outreach-run-prod.mjs enrich --limit=50'
 *   bash -c 'set -a; source .env.vercel.production; set +a; node scripts/firm-outreach-run-prod.mjs send --apply --limit=50'
 */
const [action, ...rest] = process.argv.slice(2);
const limitArg = rest.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;
const apply = rest.includes('--apply');

async function main() {
  if (action === 'enrich') {
    const { runFirmEnrichment } = await import('../lib/firm-outreach/enrichment/run-enrich.ts');
    const stats = await runFirmEnrichment({ limit });
    console.log('[firm-outreach enrich]', JSON.stringify(stats, null, 2));
    return;
  }
  if (action === 'send') {
    const { runFirmOutreach } = await import('../lib/firm-outreach/outreach/run-outreach.ts');
    const stats = await runFirmOutreach({ dryRun: !apply, limit });
    console.log('[firm-outreach send]', apply ? 'APPLY' : 'DRY-RUN', JSON.stringify(stats, null, 2));
    return;
  }
  if (action === 'stats') {
    const { getKV } = await import('../lib/kv.ts');
    if (!getKV()) {
      console.error('[stats] KV not configured', {
        urlLen: process.env.KV_REST_API_URL?.length ?? 0,
        tokenLen: process.env.KV_REST_API_TOKEN?.length ?? 0,
      });
      process.exit(1);
    }
    const { buildOutreachActivityReport } = await import(
      '../lib/firm-outreach/outreach/activity-report.ts'
    );
    const { report, prospectCounts } = await buildOutreachActivityReport();
    console.log(
      JSON.stringify(
        {
          ready_to_send: prospectCounts.ready_to_send ?? report.summary.readyToSend,
          sent_today: report.summary.sentToday,
          discovered: prospectCounts.discovered ?? report.summary.discovered,
        },
        null,
        2,
      ),
    );
    return;
  }
  if (action === 'requalify') {
    const { requalifyAllProspects } = await import('../lib/firm-outreach/requalify-prospects.ts');
    const { countProspectsByStatus } = await import('../lib/firm-outreach/storage.ts');
    const countsBefore = await countProspectsByStatus();
    const requalify = await requalifyAllProspects({ verifyWebsites: false });
    const countsAfter = await countProspectsByStatus();
    console.log('[firm-outreach requalify]', JSON.stringify({ requalify, countsBefore, countsAfter }, null, 2));
    return;
  }
  console.error('Usage: enrich [--limit=N] | send [--apply] [--limit=N] | stats | requalify');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
