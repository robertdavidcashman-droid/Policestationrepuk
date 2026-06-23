#!/usr/bin/env npx tsx
/**
 * Audit custody suite coverage by force and FORCE_CUSTODY_PAGES registry.
 *
 *   npx tsx scripts/audit-force-custody-coverage.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isCustodyStation } from '../lib/custody-station';
import { FORCE_CUSTODY_PAGES } from '../lib/custody-discovery/official-pages';
import type { PoliceStation } from '../lib/types';

const STATIONS_PATH = resolve(process.cwd(), 'data/stations.json');

function main() {
  const stations = JSON.parse(readFileSync(STATIONS_PATH, 'utf-8')) as PoliceStation[];
  const byForce = new Map<string, { total: number; custody: number }>();

  for (const st of stations) {
    const force = st.forceName?.trim() || 'Unknown force';
    const row = byForce.get(force) ?? { total: 0, custody: 0 };
    row.total++;
    if (isCustodyStation(st) || /custody|justice centre/i.test(st.name ?? '')) {
      row.custody++;
    }
    byForce.set(force, row);
  }

  const ranked = [...byForce.entries()]
    .filter(([, v]) => v.custody > 0)
    .sort((a, b) => b[1].custody - a[1].custody);

  console.log('Top forces by custody-related stations:\n');
  for (const [force, stats] of ranked.slice(0, 20)) {
    const key = force.toLowerCase();
    const registered = Boolean(FORCE_CUSTODY_PAGES[key]);
    console.log(
      `${String(stats.custody).padStart(3)} custody  ${force}${registered ? '  [FORCE_CUSTODY_PAGES]' : ''}`,
    );
  }

  const unregistered = ranked.filter(([force]) => !FORCE_CUSTODY_PAGES[force.toLowerCase()]);
  console.log(`\nForces with custody stations but no FORCE_CUSTODY_PAGES entry: ${unregistered.length}`);
}

main();
