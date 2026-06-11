/**
 * Downgrade or exclude unqualified ready_to_send prospects (e.g. archive-only non-crime firms).
 * npx tsx scripts/firm-outreach-requalify.ts
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config();

async function main() {
  const { requalifyAllProspects } = await import('../lib/firm-outreach/requalify-prospects');
  const result = await requalifyAllProspects();
  console.log('[firm-outreach requalify]', JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('[firm-outreach requalify] failed:', err);
  process.exit(1);
});
