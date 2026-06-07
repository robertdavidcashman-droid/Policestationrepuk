#!/usr/bin/env npx tsx
/**
 * Build Police Station Agent coverage index from stations.json.
 * Kent stations always qualify; others within ~45 min drive of West Kingsdown.
 */
import fs from 'fs';
import path from 'path';
import type { PoliceStation } from '../lib/types';
import {
  countyNameToSlug,
  coverageReasonForStation,
  isStationInCoverage,
  PSA_COVERAGE_HUB,
  PSA_MAX_DRIVE_MINUTES,
} from '../lib/policestationagent-coverage-core';
import { withDerivedCounty } from '../lib/force-county';

const ROOT = process.cwd();
const STATIONS_PATH = path.join(ROOT, 'data/stations.json');
const OUT_PATH = path.join(ROOT, 'data/policestationagent-coverage.json');

function main() {
  const stations = JSON.parse(fs.readFileSync(STATIONS_PATH, 'utf8')) as PoliceStation[];
  const enriched = stations.map((s) => withDerivedCounty(s));

  const stationSlugs: string[] = [];
  const stationIds: string[] = [];
  const countyCoverage: Record<string, { covered: number; total: number }> = {};

  for (const station of enriched) {
    if (!isStationInCoverage(station)) continue;
    stationSlugs.push(station.slug);
    stationIds.push(station.id);

    const countySlug = countyNameToSlug(station.county || 'Other');
    if (!countyCoverage[countySlug]) {
      countyCoverage[countySlug] = { covered: 0, total: 0 };
    }
    countyCoverage[countySlug].covered++;
  }

  for (const station of enriched) {
    const countySlug = countyNameToSlug(station.county || 'Other');
    if (!countyCoverage[countySlug]) {
      countyCoverage[countySlug] = { covered: 0, total: 0 };
    }
    countyCoverage[countySlug].total++;
  }

  const countySlugsWithCoverage: Record<string, 'full' | 'partial'> = {};
  for (const [slug, counts] of Object.entries(countyCoverage)) {
    if (counts.covered === 0) continue;
    countySlugsWithCoverage[slug] =
      counts.covered >= counts.total ? 'full' : 'partial';
  }

  const payload = {
    hub: PSA_COVERAGE_HUB,
    maxDriveMinutes: PSA_MAX_DRIVE_MINUTES,
    stationSlugs: stationSlugs.sort(),
    stationIds: stationIds.sort(),
    countySlugsWithCoverage,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(
    `PSA coverage: ${stationSlugs.length}/${enriched.length} stations, ${Object.keys(countySlugsWithCoverage).length} counties`,
  );

  // Calibration hints
  const checks = [
    'sevenoaks',
    'croydon-police-station',
    'maidstone-police-station',
    'medway-police-station',
    'manchester-piccadilly',
    'colchester-police-station',
  ];
  for (const needle of checks) {
    const st = enriched.find((s) => s.slug.includes(needle) || s.name.toLowerCase().includes(needle));
    if (!st) continue;
    const reason = coverageReasonForStation(st);
    console.log(`  ${st.slug}: ${reason ?? 'out'} (${st.forceName})`);
  }
}

main();
