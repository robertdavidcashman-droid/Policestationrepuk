/**
 * Run firm prospect discovery (LAA + DSCC + archive + directory).
 * npx tsx scripts/firm-outreach-discovery.ts
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config();

const { runFirmDiscovery } = await import('../lib/firm-outreach/discovery/run-discovery');

const stats = await runFirmDiscovery();
console.log('[firm-outreach discovery]', JSON.stringify(stats, null, 2));
