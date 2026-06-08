#!/usr/bin/env npx tsx
import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(process.cwd(), '.env.local') });
config({ path: path.join(process.cwd(), '.env.vercel.production') });

/**
 * Manual editorial audit run.
 *
 * Usage:
 *   npx tsx scripts/run-editorial-audit.ts
 *   npx tsx scripts/run-editorial-audit.ts --limit=5
 */

import { runEditorialAudit } from '../lib/editorial-audit/scheduler';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

async function main() {
  const limit = arg('limit') ? Number(arg('limit')) : undefined;
  const result = await runEditorialAudit({ limit });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
