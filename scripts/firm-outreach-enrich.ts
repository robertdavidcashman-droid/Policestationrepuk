/**
 * Enrich firm prospects (SRA org + website email crawl).
 * npx tsx scripts/firm-outreach-enrich.ts [--limit=25]
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config();

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;

const { runFirmEnrichment } = await import('../lib/firm-outreach/enrichment/run-enrich');

const stats = await runFirmEnrichment({ limit });
console.log('[firm-outreach enrich]', JSON.stringify(stats, null, 2));
