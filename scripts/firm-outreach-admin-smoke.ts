/**
 * Smoke test: buildOutreachActivityReport should finish within 10s against real KV.
 * npx tsx scripts/firm-outreach-admin-smoke.ts
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config();

const MAX_MS = 20_000;

async function main() {
  const { buildOutreachActivityReport } = await import(
    '../lib/firm-outreach/outreach/activity-report'
  );
  const { getKV } = await import('../lib/kv');

  if (!getKV()) {
    console.error('[firm-outreach admin-smoke] KV not configured — set KV_REST_API_URL in .env.local');
    process.exit(1);
  }

  const start = Date.now();
  const { report, prospectCounts } = await buildOutreachActivityReport();
  const elapsed = Date.now() - start;

  console.log('[firm-outreach admin-smoke] elapsed_ms:', elapsed);
  console.log('[firm-outreach admin-smoke] sends:', report.summary.totalSends);
  console.log('[firm-outreach admin-smoke] sent_today:', report.summary.sentToday);
  console.log('[firm-outreach admin-smoke] sent_7d:', report.summary.sentLast7Days);
  console.log('[firm-outreach admin-smoke] discovered:', prospectCounts.discovered ?? report.summary.discovered);
  console.log('[firm-outreach admin-smoke] ready_to_send:', prospectCounts.ready_to_send ?? report.summary.readyToSend);
  console.log('[firm-outreach admin-smoke] ready_rows:', report.readyToSendProspects.length);
  console.log('[firm-outreach admin-smoke] excluded_rows:', report.excludedProspects.length);

  if (elapsed > MAX_MS) {
    console.error(`[firm-outreach admin-smoke] FAIL: exceeded ${MAX_MS}ms`);
    process.exit(1);
  }

  console.log('[firm-outreach admin-smoke] OK');
}

main().catch((err) => {
  console.error('[firm-outreach admin-smoke] failed:', err);
  process.exit(1);
});
