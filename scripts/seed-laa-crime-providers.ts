/**
 * Seed unclaimed, source-verified provider stubs into the Legal Services
 * Directory from data/laa-crime-providers.json (produced by
 * fetch-laa-crime-providers.ts).
 *
 * Dry-run by default — prints what it would create/update without writing.
 * Pass --apply to persist to KV (requires Upstash env vars).
 *
 * Usage:
 *   npx tsx scripts/seed-laa-crime-providers.ts            # dry-run
 *   npx tsx scripts/seed-laa-crime-providers.ts --limit=25 # cap
 *   npx tsx scripts/seed-laa-crime-providers.ts --apply    # write
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local') });
config(); // fallback .env
import { readFileSync } from 'fs';
import {
  buildLaaProviderStub,
  type LaaProviderRecord,
} from '../lib/legal-directory/laa-seed';
import { upsertSeededListing } from '../lib/legal-directory/storage';
import { getDirectoryStore } from '../lib/legal-directory/store';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IN_PATH = resolve(__dirname, '../data/laa-crime-providers.json');

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const limit = Number(arg('limit') ?? '0') || 0;

  let records: LaaProviderRecord[];
  try {
    records = JSON.parse(readFileSync(IN_PATH, 'utf-8')) as LaaProviderRecord[];
  } catch {
    console.error(
      `[laa-seed] Could not read ${IN_PATH}. Run fetch-laa-crime-providers.ts first.`,
    );
    process.exit(1);
    return;
  }

  const slice = limit ? records.slice(0, limit) : records;
  console.log(
    `[laa-seed] ${slice.length} records${limit ? ` (limited from ${records.length})` : ''} · mode: ${apply ? 'APPLY' : 'DRY-RUN'}`,
  );

  if (apply) {
    const store = getDirectoryStore();
    if (!store?.durable) {
      console.error(
        '[laa-seed] ABORT: Upstash KV not configured. Set UPSTASH_REDIS_REST_URL/TOKEN (or KV_*) in .env.local.',
      );
      process.exit(1);
    }
    console.log('[laa-seed] connected to durable KV — writing unclaimed stubs (noindex until claimed)');
  }

  let created = 0;
  let updated = 0;
  for (const record of slice) {
    const stub = buildLaaProviderStub(record);
    if (!apply) {
      console.log(`  • ${stub.businessName} → /legal-services-directory/listing/${stub.slug} [${stub.category}]`);
      continue;
    }
    try {
      const res = await upsertSeededListing(stub);
      if (res.created) created++;
      else updated++;
      await new Promise((r) => setTimeout(r, 40));
    } catch (err) {
      console.error(`  ! failed for ${stub.businessName}:`, err instanceof Error ? err.message : err);
    }
  }

  if (apply) {
    console.log(`[laa-seed] done. created=${created} updated=${updated}`);
  } else {
    console.log('[laa-seed] dry-run complete. Re-run with --apply to write to KV.');
  }
}

main().catch((err) => {
  console.error('[laa-seed] failed:', err);
  process.exit(1);
});
