#!/usr/bin/env npx tsx
/**
 * Seed Kent firms into agent_cover_kent_v1 campaign (idempotent).
 * npx tsx scripts/firm-outreach-seed-agent-cover-kent.ts [--apply]
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const apply = process.argv.includes('--apply');

async function main() {
  const { getKV } = await import('../lib/kv');
  if (!getKV()) {
    console.error('[seed-agent-cover] KV not configured');
    process.exit(1);
  }

  const { AGENT_COVER_KENT_CAMPAIGN_ID } = await import('../lib/firm-outreach/campaign-scope');
  const { runFirmDiscovery } = await import('../lib/firm-outreach/discovery/run-discovery');

  if (!apply) {
    console.log('[seed-agent-cover] DRY-RUN — pass --apply to write to KV');
    process.exit(0);
  }

  const stats = await runFirmDiscovery({
    campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
    countyAllowlist: ['kent'],
  });

  console.log('[seed-agent-cover] APPLY', JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error('[seed-agent-cover] failed:', err);
  process.exit(1);
});
