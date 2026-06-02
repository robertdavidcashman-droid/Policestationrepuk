/**
 * Audit custody station candidates and optionally apply isCustodyStation flags.
 * Run: npx tsx scripts/audit-custody-stations.ts [--apply-flags]
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  isCustodyStation,
  nameMatchesSeed,
  slugMatchesSeed,
} from '../lib/custody-station';
import { loadCustodySeedFromGenerateData } from '../lib/custody-seed';
import type { PoliceStation } from '../lib/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIONS_PATH = resolve(ROOT, 'data/stations.json');
const AUDIT_PATH = resolve(ROOT, 'data/custody-station-audit.json');
const BASE44_PATH = resolve(ROOT, 'data/stations-base44-raw.json');
const APPLY = process.argv.includes('--apply-flags');

type AuditRow = {
  id: string;
  slug: string;
  name: string;
  forceName?: string;
  reasons: string[];
  recommendFlag: boolean;
  currentFlag: boolean;
};

const stations: PoliceStation[] = JSON.parse(readFileSync(STATIONS_PATH, 'utf-8'));
const seeds = loadCustodySeedFromGenerateData(ROOT);

const base44BySlug = new Map<string, boolean>();
if (existsSync(BASE44_PATH)) {
  const raw = JSON.parse(readFileSync(BASE44_PATH, 'utf-8')) as Array<{
    station_name?: string;
    is_custody_station?: boolean;
  }>;
  for (const r of raw) {
    if (!r.is_custody_station) continue;
    const slug = (r.station_name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (slug) base44BySlug.set(slug, true);
  }
}

const audit: AuditRow[] = [];

for (const s of stations) {
  const reasons: string[] = [];
  const currentFlag = Boolean(s.isCustodyStation || s.custodySuite);

  if (isCustodyStation(s) && !currentFlag) {
    reasons.push('name_heuristic');
  }

  for (const seed of seeds) {
    if (slugMatchesSeed(seed.slug, s.slug) || nameMatchesSeed(seed.name, s.name)) {
      reasons.push(`seed:${seed.slug}`);
      break;
    }
  }

  const normSlug = s.slug.replace(/-police-station$/, '');
  if (base44BySlug.has(normSlug) || base44BySlug.has(s.slug)) {
    reasons.push('base44_is_custody_station');
  }

  const recommendFlag = reasons.length > 0;
  if (recommendFlag || currentFlag) {
    audit.push({
      id: s.id,
      slug: s.slug,
      name: s.name,
      forceName: s.forceName,
      reasons,
      recommendFlag,
      currentFlag,
    });
  }
}

const toFlag = audit.filter((r) => r.recommendFlag && !r.currentFlag);
console.log(`Audit rows: ${audit.length}`);
console.log(`Recommend new flags: ${toFlag.length}`);
console.log(`Already flagged: ${audit.filter((r) => r.currentFlag).length}`);

writeFileSync(
  AUDIT_PATH,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalStations: stations.length,
      auditRows: audit.length,
      recommendNewFlags: toFlag.length,
      rows: audit,
    },
    null,
    2,
  ) + '\n',
);
console.log('Wrote', AUDIT_PATH);

if (APPLY) {
  const recommendIds = new Set(toFlag.map((r) => r.id));
  let applied = 0;
  for (const s of stations) {
    if (recommendIds.has(s.id)) {
      s.isCustodyStation = true;
      applied++;
    }
  }
  writeFileSync(STATIONS_PATH, JSON.stringify(stations, null, 2) + '\n');
  console.log(`Applied isCustodyStation=true to ${applied} stations`);
} else {
  console.log('Dry-run flags. Re-run with --apply-flags to update stations.json');
}
