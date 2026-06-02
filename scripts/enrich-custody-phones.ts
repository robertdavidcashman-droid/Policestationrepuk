/**
 * Enrich custodyPhone from legacy seed + policestationreps.com (with provenance).
 * Run: npx tsx scripts/enrich-custody-phones.ts [--write] [--fetch] [--force="Kent Police"]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { isCustodyStation, nameMatchesSeed, slugMatchesSeed } from '../lib/custody-station';
import { loadCustodySeedFromGenerateData } from '../lib/custody-seed';
import {
  parseRepDirectoryStationHtml,
  repDirectoryUrlFromSlug,
} from '../lib/rep-directory-parse';
import { formatPhoneUk, isPlausibleUkPhoneField, normalizePhoneDigits } from '../lib/phone-format';
import {
  loadPhoneProvenance,
  savePhoneProvenance,
  stationProvenanceKey,
  type PhoneProvenanceEntry,
  type StationPhoneProvenanceFile,
} from '../lib/station-phone-provenance';
import { classifyPhone } from '../lib/station-search';
import type { PoliceStation } from '../lib/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIONS_PATH = resolve(ROOT, 'data/stations.json');
const REPORTS_DIR = resolve(ROOT, 'data/reports');

const WRITE = process.argv.includes('--write');
const FETCH = process.argv.includes('--fetch');
const forceArg = process.argv.find((a) => a.startsWith('--force='));
const FORCE_FILTER = forceArg?.split('=')[1]?.trim();
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0');

const FETCH_DELAY_MS = 1200;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isValidCustodyNumber(number: string): boolean {
  if (!isPlausibleUkPhoneField(number)) return false;
  const digits = normalizePhoneDigits(number);
  if (digits === '101') return false;
  const cls = classifyPhone({
    id: 'x',
    slug: 'x',
    name: 'x',
    address: '',
    custodyPhone: number,
  } as PoliceStation);
  return cls === 'station';
}

type EnrichReport = {
  station: string;
  slug: string;
  action: string;
  number?: string;
  source?: string;
};

async function fetchRepDirectory(slug: string): Promise<string | null> {
  const url = repDirectoryUrlFromSlug(slug);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PoliceStationRepUK-data-enrich/1.0 (+https://policestationrepuk.org)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
const stations: PoliceStation[] = JSON.parse(readFileSync(STATIONS_PATH, 'utf-8'));
const seeds = loadCustodySeedFromGenerateData(ROOT);
const provenance: StationPhoneProvenanceFile = loadPhoneProvenance();
const report: EnrichReport[] = [];
const today = new Date().toISOString().slice(0, 10);

let custodyTargets = stations.filter((s) => isCustodyStation(s));
if (FORCE_FILTER) {
  custodyTargets = custodyTargets.filter((s) => s.forceName === FORCE_FILTER);
}
if (LIMIT > 0) custodyTargets = custodyTargets.slice(0, LIMIT);

console.log(`Mode: ${WRITE ? 'WRITE' : 'dry-run'} | fetch: ${FETCH}`);
console.log(`Custody targets: ${custodyTargets.length}`);

let fetchCount = 0;

for (const station of custodyTargets) {
  const key = stationProvenanceKey(station);
  const existing = (station.custodyPhone || '').trim();
  if (existing && isValidCustodyNumber(existing)) continue;

  let candidate: string | undefined;
  let source = '';
  let confidence: PhoneProvenanceEntry['confidence'] = 'medium';

  const seed = seeds.find(
    (e) => slugMatchesSeed(e.slug, station.slug) || nameMatchesSeed(e.name, station.name),
  );
  if (seed?.phone && isValidCustodyNumber(seed.phone)) {
    candidate = formatPhoneUk(seed.phone);
    source = 'scripts/generate-data.js (legacy custody seed)';
    confidence = 'medium';
  }

  if (FETCH && !candidate) {
    if (fetchCount > 0) await sleep(FETCH_DELAY_MS);
    fetchCount++;
    const html = await fetchRepDirectory(station.slug);
    if (html) {
      const url = repDirectoryUrlFromSlug(station.slug);
      const parsed = parseRepDirectoryStationHtml(html, url);
      if (parsed.custodyPhone && isValidCustodyNumber(parsed.custodyPhone)) {
        candidate = parsed.custodyPhone;
        source = url;
        confidence = 'high';
      }
    }
  }

  if (!candidate) {
    report.push({ station: station.name, slug: station.slug, action: 'no_source' });
    continue;
  }

  report.push({
    station: station.name,
    slug: station.slug,
    action: existing ? 'update' : 'add',
    number: candidate,
    source,
  });

  if (WRITE) {
    station.custodyPhone = candidate;
    if (!provenance[key]) provenance[key] = {};
    provenance[key].custodyPhone = {
      number: candidate,
      source,
      verifiedAt: today,
      confidence,
      field: 'custodyPhone',
    };
  }
}

mkdirSync(REPORTS_DIR, { recursive: true });
const reportPath = resolve(
  REPORTS_DIR,
  `custody-enrich-${today}${FORCE_FILTER ? '-' + FORCE_FILTER.replace(/\s+/g, '-') : ''}.json`,
);
writeFileSync(
  reportPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      write: WRITE,
      fetch: FETCH,
      forceFilter: FORCE_FILTER || null,
      applied: report.filter((r) => r.action === 'add' || r.action === 'update').length,
      noSource: report.filter((r) => r.action === 'no_source').length,
      rows: report,
    },
    null,
    2,
  ) + '\n',
);

console.log(`Report: ${reportPath}`);
console.log(`Adds/updates: ${report.filter((r) => r.action === 'add' || r.action === 'update').length}`);
console.log(`No source: ${report.filter((r) => r.action === 'no_source').length}`);

if (WRITE) {
  writeFileSync(STATIONS_PATH, JSON.stringify(stations, null, 2) + '\n');
  savePhoneProvenance(provenance);
  console.log('Wrote stations.json and station-phone-provenance.json');
} else {
  console.log('Dry-run. Use --write to apply.');
}
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
