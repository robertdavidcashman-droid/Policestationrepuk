/**
 * Enrich firm prospects (SRA org + website email crawl).
 * npx tsx scripts/firm-outreach-enrich.ts [--limit=60] [--batches=5] [--max-ms=270000]
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local'), override: true });
config({ override: true });

function argNum(prefix: string): number | undefined {
  const raw = process.argv.find((a) => a.startsWith(`${prefix}=`));
  if (!raw) return undefined;
  const n = Number(raw.split('=')[1]);
  return Number.isFinite(n) ? n : undefined;
}

async function main() {
  const limit = argNum('--limit');
  const batches = argNum('--batches') ?? 1;
  const maxElapsedMs = argNum('--max-ms');
  const { runFirmEnrichment } = await import('../lib/firm-outreach/enrichment/run-enrich');

  let totalReady = 0;
  let totalEmails = 0;
  for (let i = 0; i < batches; i++) {
    const stats = await runFirmEnrichment({ limit, maxElapsedMs });
    totalReady += stats.readyToSend;
    totalEmails += stats.emailsFound;
    console.log(`[firm-outreach enrich batch ${i + 1}/${batches}]`, JSON.stringify(stats, null, 2));
    if (stats.processed === 0) break;
  }
  console.log('[firm-outreach enrich] totals', { batchesRun: batches, totalEmails, totalReady });
}

main().catch((err) => {
  console.error('[firm-outreach enrich] failed:', err);
  process.exit(1);
});
