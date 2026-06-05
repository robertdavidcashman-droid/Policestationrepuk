/**
 * Restore custody phone values removed during the first accuracy pass.
 * npx tsx scripts/restore-cleared-station-phones.ts [--write]
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import type { PoliceStation } from '../lib/types';
import type { StationPhoneProvenanceFile } from '../lib/station-phone-provenance';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIONS_PATH = resolve(ROOT, 'data/stations.json');
const PROVENANCE_PATH = resolve(ROOT, 'data/station-phone-provenance.json');
const WRITE = process.argv.includes('--write');
const BASE = 'e743809';

function loadJson<T>(ref: string): T {
  return JSON.parse(execSync(`git show ${ref}`, { cwd: ROOT, encoding: 'utf8' })) as T;
}

const beforeStations = loadJson<PoliceStation[]>(`${BASE}:data/stations.json`);
const beforeProv = loadJson<StationPhoneProvenanceFile>(`${BASE}:data/station-phone-provenance.json`);
const afterStations = JSON.parse(readFileSync(STATIONS_PATH, 'utf8')) as PoliceStation[];
const afterProv = JSON.parse(readFileSync(PROVENANCE_PATH, 'utf8')) as StationPhoneProvenanceFile;

const isDialable = (v?: string) => {
  const t = (v ?? '').trim();
  if (!t || /not publicly/i.test(t)) return false;
  if (t === '101' || t === '999') return true;
  return /^[\d\s+()-]{6,}$/.test(t);
};

const bySlug = new Map(afterStations.map((s) => [s.slug, s]));
let restoredCustody = 0;
let restoredProv = 0;

for (const prev of beforeStations) {
  const cur = bySlug.get(prev.slug);
  if (!cur) continue;
  if (isDialable(prev.custodyPhone) && !isDialable(cur.custodyPhone)) {
    if (WRITE) cur.custodyPhone = prev.custodyPhone;
    restoredCustody++;
  }
}

for (const [key, row] of Object.entries(beforeProv)) {
  if (!afterProv[key] && row.custodyPhone) {
    if (WRITE) afterProv[key] = { custodyPhone: row.custodyPhone };
    restoredProv++;
  } else if (afterProv[key] && row.custodyPhone && !afterProv[key].custodyPhone) {
    if (WRITE) afterProv[key].custodyPhone = row.custodyPhone;
    restoredProv++;
  }
}

console.log(JSON.stringify({ restoredCustody, restoredProv, mode: WRITE ? 'write' : 'dry-run' }, null, 2));

if (WRITE) {
  writeFileSync(STATIONS_PATH, JSON.stringify(afterStations, null, 2) + '\n');
  writeFileSync(PROVENANCE_PATH, JSON.stringify(afterProv, null, 2) + '\n');
  console.log('Wrote stations.json and station-phone-provenance.json');
} else {
  console.log('Dry-run. Re-run with --write to apply.');
}
