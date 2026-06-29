/**
 * Rebuild firm outreach status indexes in KV.
 * npx tsx scripts/firm-outreach-reindex.ts
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local'), override: true });
config({ override: true });

async function main() {
  const { reindexProspectStatuses } = await import('../lib/firm-outreach/reindex-prospects');
  const result = await reindexProspectStatuses();
  console.log('[firm-outreach reindex]', JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('[firm-outreach reindex] failed:', err);
  process.exit(1);
});
