/**
 * Preview next outreach recipients with skip reasons (no sends).
 * Usage: npx tsx scripts/firm-outreach-dry-run-preview.ts [--limit=25]
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) || 25 : 25;

  const { buildOutreachDryRunPreview } = await import('../lib/firm-outreach/dry-run-preview');
  const preview = await buildOutreachDryRunPreview({ limit });

  console.log(JSON.stringify(preview, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
