#!/usr/bin/env npx tsx
/** List sendable outreach prospects per campaign/site. */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { qualifyProspectForOutreach } from '../lib/firm-outreach/qualification';
import { isSuppressed, listProspectsByRecordStatus } from '../lib/firm-outreach/storage';
import { OUTREACH_CAMPAIGN_IDS } from '../lib/firm-outreach/site-config';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const SITE_BY_CAMPAIGN: Record<string, string> = {
  whatsapp_invite_v1: 'policestationrepuk.org',
  agent_cover_kent_v1: 'policestationagent.com',
};

async function main() {
  for (const campaignId of OUTREACH_CAMPAIGN_IDS) {
    const ready = await listProspectsByRecordStatus('ready_to_send', 5000, { campaignId });
    const sent = await listProspectsByRecordStatus('sent', 5000, { campaignId });
    const all = [...ready, ...sent];
    const rows: Array<{ firm: string; email: string; county: string; status: string; step: number }> = [];
    for (const p of all) {
      if (p.campaignId !== campaignId) continue;
      const email = p.email?.trim();
      if (!email) continue;
      if (await isSuppressed(email)) continue;
      if (!qualifyProspectForOutreach(p).qualified) continue;
      rows.push({
        firm: p.firmName,
        email,
        county: p.county ?? '',
        status: p.status,
        step: p.sequenceStep ?? 0,
      });
    }
    const site = SITE_BY_CAMPAIGN[campaignId] ?? campaignId;
    console.log(`\n=== ${site} (${campaignId}) — ${rows.length} sendable ===`);
    for (const r of rows) {
      console.log(`${r.email}\t${r.firm}\t${r.county}\t${r.status}\tstep${r.step}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
