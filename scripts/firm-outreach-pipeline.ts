/**
 * Run the full automated firm outreach pipeline locally.
 * npx tsx scripts/firm-outreach-pipeline.ts [--maintain] [--force-laa]
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config();

function numArg(name: string): number | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split('=')[1]) || undefined : undefined;
}

async function main() {
  const maintain = process.argv.includes('--maintain');
  const forceLaa = process.argv.includes('--force-laa');

  const { runFirmOutreachPipeline } = await import('../lib/firm-outreach/run-pipeline');

  const result = await runFirmOutreachPipeline({
    skipSend: maintain,
    forceLaaRefresh: forceLaa,
    enrichLimit: numArg('enrich-limit'),
    sendLimit: numArg('send-limit'),
  });

  console.log('[firm-outreach pipeline]', JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('[firm-outreach pipeline] failed:', err);
  process.exit(1);
});
