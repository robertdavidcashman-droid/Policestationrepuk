#!/usr/bin/env npx tsx
/** Manual run of nightly queue reprocess (weak evidence refetch, conflicts, reapply). */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  process.env.CUSTODY_AI_AUTO_PUBLISH = process.env.CUSTODY_AI_AUTO_PUBLISH ?? 'true';
  process.env.CUSTODY_AI_AUTO_REJECT = process.env.CUSTODY_AI_AUTO_REJECT ?? 'true';
  process.env.CUSTODY_AI_AUTO_RESOLVE_CONFLICTS =
    process.env.CUSTODY_AI_AUTO_RESOLVE_CONFLICTS ?? 'true';

  const { runOpenQueueReprocess } = await import('../lib/custody-discovery/queue-reprocessor');
  const result = await runOpenQueueReprocess();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
