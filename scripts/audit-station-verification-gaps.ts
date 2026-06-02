/**
 * Build priority queue for station telephone/address verification.
 * npx tsx scripts/audit-station-verification-gaps.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { PoliceStation } from '../lib/types';
import { isDialablePhone, stationVerificationKey } from '../lib/station-verification';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIONS_PATH = resolve(ROOT, 'data/stations.json');
const OUT_PATH = resolve(ROOT, 'data/reports/station-verification-queue.json');

function isCustodyCandidate(s: PoliceStation): boolean {
  const name = s.name.toLowerCase();
  return Boolean(s.isCustodyStation || s.custodySuite || name.includes('custody'));
}

function tier(s: PoliceStation): number {
  const custody = isCustodyCandidate(s);
  const noPhone = !isDialablePhone(s.phone);
  const noCustody = !isDialablePhone(s.custodyPhone);
  if (custody && noCustody) return 1;
  if (noPhone) return 2;
  if (custody && noCustody) return 3;
  if (noCustody) return 4;
  return 5;
}

const stations = JSON.parse(readFileSync(STATIONS_PATH, 'utf-8')) as PoliceStation[];

const queue = stations
  .map((s) => ({
    key: stationVerificationKey(s),
    id: s.id,
    slug: s.slug,
    name: s.name,
    forceName: s.forceName ?? '',
    tier: tier(s),
    isCustodyCandidate: isCustodyCandidate(s),
    hasDialablePhone: isDialablePhone(s.phone),
    hasDialableCustodyPhone: isDialablePhone(s.custodyPhone),
    address: s.address,
    status: s.status ?? 'active',
  }))
  .filter((r) => r.tier <= 4)
  .sort((a, b) => a.tier - b.tier || a.forceName.localeCompare(b.forceName) || a.name.localeCompare(b.name));

const byForce: Record<string, typeof queue> = {};
for (const row of queue) {
  const f = row.forceName || 'Unknown force';
  if (!byForce[f]) byForce[f] = [];
  byForce[f].push(row);
}

const summary = {
  generatedAt: new Date().toISOString(),
  totalStations: stations.length,
  queued: queue.length,
  tier1_custodyMissingCustody: queue.filter((r) => r.tier === 1).length,
  tier2_missingMainPhone: queue.filter((r) => r.tier === 2).length,
  tier3: queue.filter((r) => r.tier === 3).length,
  tier4_missingCustody: queue.filter((r) => r.tier === 4).length,
};

mkdirSync(resolve(ROOT, 'data/reports'), { recursive: true });
writeFileSync(
  OUT_PATH,
  JSON.stringify({ summary, queue, byForce }, null, 2) + '\n',
);

console.log(JSON.stringify(summary, null, 2));
console.log(`Wrote ${OUT_PATH}`);
