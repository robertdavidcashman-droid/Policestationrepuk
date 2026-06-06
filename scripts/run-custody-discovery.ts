#!/usr/bin/env npx tsx
import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(process.cwd(), '.env.local') });
config({ path: path.join(process.cwd(), '.env.vercel.production') });

/**
 * Manual custody number discovery run.
 *
 * Usage:
 *   npx tsx scripts/run-custody-discovery.ts
 *   npx tsx scripts/run-custody-discovery.ts --limit=10
 *   npx tsx scripts/run-custody-discovery.ts --suite-id=abc123
 */

import { runCustodyDiscoveryCrawler } from '../lib/custody-discovery/crawler';
import { notifyIfNewFindings } from '../lib/custody-discovery/notify';
import { seedFindingsFromOfficialJson } from '../lib/custody-discovery/seed-json';
import { buildCustodySuitesFromStations } from '../lib/custody-discovery/suites';
import { bootstrapCustodySuites, getAllCustodySuites } from '../lib/custody-discovery/storage';
import { getAllStations } from '../lib/data';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

async function main() {
  const limit = Number(arg('limit') || 25);
  const suiteId = arg('suite-id');

  const stations = await getAllStations();
  const built = buildCustodySuitesFromStations(stations);
  const bootstrapped = await bootstrapCustodySuites(built);
  console.log(`Bootstrapped ${bootstrapped} custody suites`);

  const suites = await getAllCustodySuites();
  const seeded = await seedFindingsFromOfficialJson(suites);
  console.log('Seeded from official JSON:', seeded);

  const { stats, newFindingIds } = await runCustodyDiscoveryCrawler(suites, {
    limit,
    suiteIds: suiteId ? [suiteId] : undefined,
    useCursor: !suiteId,
  });

  const allNewIds = [...seeded.newFindingIds, ...newFindingIds];
  const notification = await notifyIfNewFindings({
    newFindingIds: allNewIds,
    stats,
    seededCreated: seeded.created,
  });

  console.log(JSON.stringify({ stats, newFindingIds: allNewIds, notification }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
