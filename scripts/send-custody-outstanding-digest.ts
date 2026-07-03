#!/usr/bin/env npx tsx
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.pull'), quiet: true });
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  const force = process.argv.includes('--force');
  const { sendDailyOutstandingDigest } = await import('../lib/custody-discovery/outstanding-digest');
  const result = await sendDailyOutstandingDigest({ force });
  console.log(JSON.stringify(result, null, 2));
  if (!result.sent) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
