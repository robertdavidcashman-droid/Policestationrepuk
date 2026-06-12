/**
 * Import lead_engine ready_to_send.csv into firm-outreach KV prospects.
 *
 * npx tsx scripts/firm-outreach-import-lead-engine.ts [--dry-run] [--include-guessed]
 * npx tsx scripts/firm-outreach-import-lead-engine.ts --file=lead_engine/data/exports/ready_to_send.csv
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config();

const dryRun = process.argv.includes('--dry-run');
const includeGuessed = process.argv.includes('--include-guessed');
const fileArg = process.argv.find((a) => a.startsWith('--file='));
const csvPath = fileArg?.split('=')[1];

async function main() {
  const { DEFAULT_LEAD_ENGINE_CSV, importLeadEngineCsv } = await import(
    '../lib/firm-outreach/import-lead-engine'
  );

  const stats = await importLeadEngineCsv(csvPath ?? DEFAULT_LEAD_ENGINE_CSV, {
    dryRun,
    includeGuessed,
  });

  console.log('[firm-outreach import-lead-engine]', JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error('[firm-outreach import-lead-engine] failed:', err);
  process.exit(1);
});
