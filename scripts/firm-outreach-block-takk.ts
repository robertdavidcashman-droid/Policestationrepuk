#!/usr/bin/env npx tsx
/** One-off: exclude Takk & Co duplicate LAA offices and suppress shared inbox. */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { bulkExcludeProspects } from '../lib/firm-outreach/outreach/admin-actions';
import { addSuppression, getProspect } from '../lib/firm-outreach/storage';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env.vercel.production') });

const TAKK_IDS = ['fop_be274d37e3fe8c74', 'fop_ee3d51cdc3d7ba7b'] as const;
const TAKK_EMAIL = 'info@takkandcompanymedway.co.uk';

async function main() {
  const result = await bulkExcludeProspects([...TAKK_IDS], 'duplicate_firm_same_inbox');
  console.log('[block-takk] exclude:', JSON.stringify(result, null, 2));

  await addSuppression(TAKK_EMAIL, 'manual');

  for (const id of TAKK_IDS) {
    const p = await getProspect(id);
    console.log('[block-takk]', id, p?.firmName, '->', p?.status, p?.excludedReason);
  }
}

main().catch((err) => {
  console.error('[block-takk] failed:', err);
  process.exit(1);
});
