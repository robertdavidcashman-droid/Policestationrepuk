#!/usr/bin/env npx tsx
/** Flag already-published unsafe-range numbers (mobile/premium) for review. */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.pull'), quiet: true });
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  const { sweepUnsafePublishedNumbers } = await import(
    '../lib/custody-discovery/approved-recheck'
  );
  const result = await sweepUnsafePublishedNumbers();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
