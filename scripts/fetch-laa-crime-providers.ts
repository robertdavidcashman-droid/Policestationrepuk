/**
 * Fetch the published Legal Aid Agency "Directory of legal aid providers"
 * spreadsheet and extract crime / prison-law firms into a normalized JSON file.
 *
 * Output: data/laa-crime-providers.json (consumed by seed-laa-crime-providers.ts)
 *
 * Usage:
 *   npx tsx scripts/fetch-laa-crime-providers.ts                 # fetch + parse
 *   npx tsx scripts/fetch-laa-crime-providers.ts --limit=50      # cap rows
 *   npx tsx scripts/fetch-laa-crime-providers.ts --url=<xlsx>    # explicit file
 *   npx tsx scripts/fetch-laa-crime-providers.ts --file=foo.xlsx # local file
 *   npx tsx scripts/fetch-laa-crime-providers.ts --force         # ignore cache
 */
import { fetchLaaCrimeProviders } from '../lib/legal-directory/laa-fetch';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

async function main() {
  const limit = Number(arg('limit') ?? '0') || 0;
  const force = process.argv.includes('--force');

  const { records, refreshed, source } = await fetchLaaCrimeProviders({
    force,
    limit,
    url: arg('url'),
    localFile: arg('file'),
  });

  console.log(`[laa-fetch] source=${source} refreshed=${refreshed} count=${records.length}`);
  if (records.length) console.log('[laa-fetch] sample:', JSON.stringify(records[0], null, 2));
}

main().catch((err) => {
  console.error('[laa-fetch] failed:', err);
  process.exit(1);
});
