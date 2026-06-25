#!/usr/bin/env tsx
/**
 * Reset prospects with non-firm scraped emails (directories, widgets, gov.uk).
 *
 * Usage:
 *   npx tsx scripts/firm-outreach-cleanup-non-firm-emails.ts
 *   npx tsx scripts/firm-outreach-cleanup-non-firm-emails.ts --apply
 *   CAMPAIGN_ID=agent_cover_kent_v1 npx tsx scripts/firm-outreach-cleanup-non-firm-emails.ts --apply
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config();

const APPLY = process.argv.includes('--apply');
const ALL_STATUSES = process.argv.includes('--all-statuses');
const campaignArg = process.argv.find((a) => a.startsWith('--campaign='));
const campaignId =
  campaignArg?.slice('--campaign='.length)?.trim() ||
  process.env.CAMPAIGN_ID?.trim() ||
  undefined;

async function main() {
  const { getKV } = await import('../lib/kv');
  if (!getKV()) {
    console.error('[cleanup] KV not configured — set Upstash creds in .env.local');
    process.exit(1);
  }

  const { cleanupNonFirmProspectEmails } = await import(
    '../lib/firm-outreach/cleanup-non-firm-emails'
  );
  const result = await cleanupNonFirmProspectEmails({
    dryRun: !APPLY,
    campaignId,
    allStatuses: ALL_STATUSES,
  });

  console.log(`\n=== Non-firm email cleanup ${APPLY ? '(APPLY)' : '(dry run)'} ===`);
  console.log('Campaign filter:', result.campaignId ?? '(all campaigns)');
  console.log('Scanned (with email):', result.scanned);
  console.log('Targets:', result.targets.length);
  if (APPLY) console.log('Reset to discovered:', result.reset);
  console.log('');
  for (const t of result.targets) {
    console.log(`  [${t.status}] ${t.email} | ${t.firmName} | ${t.campaignId}`);
  }
  if (!APPLY && result.targets.length > 0) {
    console.log('\nRe-run with --apply to clear emails and move back to discovered.');
  }
}

main().catch((err) => {
  console.error('[cleanup] failed:', err);
  process.exit(1);
});
