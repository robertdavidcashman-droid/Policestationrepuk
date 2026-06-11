/**
 * Send WhatsApp invitation emails (dry-run by default).
 * npx tsx scripts/firm-outreach-send.ts --apply [--limit=5]
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config();

const apply = process.argv.includes('--apply');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;

const { runFirmOutreach } = await import('../lib/firm-outreach/outreach/run-outreach');

const stats = await runFirmOutreach({ dryRun: !apply, limit });
console.log('[firm-outreach send]', apply ? 'APPLY' : 'DRY-RUN', JSON.stringify(stats, null, 2));
