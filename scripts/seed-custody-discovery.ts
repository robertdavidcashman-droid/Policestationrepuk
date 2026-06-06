#!/usr/bin/env npx tsx
import { config } from 'dotenv';
import path from 'path';

config({ path: path.join(process.cwd(), '.env.local') });
config({ path: path.join(process.cwd(), '.env.vercel.production') });

import { seedFindingsFromOfficialJson } from '../lib/custody-discovery/seed-json';
import { buildCustodySuitesFromStations } from '../lib/custody-discovery/suites';
import { bootstrapCustodySuites, getAllCustodySuites } from '../lib/custody-discovery/storage';
import { getAllStations } from '../lib/data';

async function main() {
  const stations = await getAllStations();
  await bootstrapCustodySuites(buildCustodySuitesFromStations(stations));
  const suites = await getAllCustodySuites();
  const result = await seedFindingsFromOfficialJson(suites);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
