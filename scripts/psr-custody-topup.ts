/**
 * Polite PSR custody top-up: fetch missing custody numbers from policestationreps.com
 * and optionally apply safe candidates to stations.json.
 *
 * Usage:
 *   npx tsx scripts/psr-custody-topup.ts                    # dry-run report
 *   npx tsx scripts/psr-custody-topup.ts --apply            # write safe matches
 *   npx tsx scripts/psr-custody-topup.ts --limit=10         # cap fetches
 *   npx tsx scripts/psr-custody-topup.ts --force="Kent Police"
 *
 * ~1 request/sec, honest User-Agent, robots-respecting volume.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { isCustodyStation, nameMatchesSeed, slugMatchesSeed } from '../lib/custody-station';
import { loadCustodySeedFromGenerateData } from '../lib/custody-seed';
import { formatPhoneUk, isPlausibleUkPhoneField, normalizePhoneDigits } from '../lib/phone-format';
import {
  isTrustworthyPsrCustodyCandidate,
  parseRepDirectoryStationHtml,
  repDirectoryUrlCandidates,
} from '../lib/rep-directory-parse';
import {
  loadPhoneProvenance,
  savePhoneProvenance,
  stationProvenanceKey,
  type StationPhoneProvenanceFile,
} from '../lib/station-phone-provenance';
import {
  isDialablePhone,
  loadStationVerification,
  saveStationVerification,
  stationVerificationKey,
} from '../lib/station-verification';
import { classifyPhone } from '../lib/station-search';
import type { PoliceStation } from '../lib/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIONS_PATH = resolve(ROOT, 'data/stations.json');
const REPORTS_DIR = resolve(ROOT, 'data/reports');
const APPLY = process.argv.includes('--apply');
const forceArg = process.argv.find((a) => a.startsWith('--force='));
const FORCE_FILTER = forceArg?.split('=')[1]?.trim();
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0');
const FETCH_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isValidCustodyNumber(number: string): boolean {
  if (!isPlausibleUkPhoneField(number)) return false;
  if (normalizePhoneDigits(number) === '101') return false;
  return (
    classifyPhone({
      id: 'x',
      slug: 'x',
      name: 'x',
      address: '',
      custodyPhone: number,
    } as PoliceStation) === 'station'
  );
}

async function fetchRepDirectory(
  slug: string,
  name: string,
  seedSlug?: string,
  seedName?: string,
): Promise<{ html: string; url: string } | null> {
  const urls = [
    ...repDirectoryUrlCandidates(slug, name),
    ...(seedSlug || seedName ? repDirectoryUrlCandidates(seedSlug ?? slug, seedName ?? name) : []),
  ];
  const seen = new Set<string>();
  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'PoliceStationRepUK-data-enrich/1.0 (+https://policestationrepuk.org)',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const html = await res.text();
        if (/POLICE STATION|Custody:|General:/i.test(html)) return { html, url };
      }
    } catch {
      /* next */
    }
  }
  return null;
}

async function main(): Promise<void> {
  const stations: PoliceStation[] = JSON.parse(readFileSync(STATIONS_PATH, 'utf-8'));
  const seeds = loadCustodySeedFromGenerateData(ROOT);
  const provenance = loadPhoneProvenance();
  const verification = loadStationVerification();
  const today = new Date().toISOString().slice(0, 10);

  let targets = stations.filter((s) => isCustodyStation(s) && !isDialablePhone(s.custodyPhone));
  if (FORCE_FILTER) targets = targets.filter((s) => s.forceName === FORCE_FILTER);
  if (LIMIT > 0) targets = targets.slice(0, LIMIT);

  console.log(`Mode: ${APPLY ? 'APPLY' : 'dry-run'} | targets: ${targets.length}`);

  const applied: { station: string; number: string; url: string }[] = [];
  let fetchCount = 0;

  for (const station of targets) {
    const seed = seeds.find(
      (e) => slugMatchesSeed(e.slug, station.slug) || nameMatchesSeed(e.name, station.name),
    );
    if (fetchCount > 0) await sleep(FETCH_DELAY_MS);
    fetchCount++;

    const fetched = await fetchRepDirectory(station.slug, station.name, seed?.slug, seed?.name);
    if (!fetched) {
      console.log(`  skip (no page): ${station.name}`);
      continue;
    }

    const parsed = parseRepDirectoryStationHtml(fetched.html, fetched.url);
    if (!isTrustworthyPsrCustodyCandidate(parsed) || !isValidCustodyNumber(parsed.custodyPhone!)) {
      console.log(`  skip (no safe custody): ${station.name}`);
      continue;
    }

    const formatted = formatPhoneUk(parsed.custodyPhone!);
    console.log(`  + ${station.name}: ${formatted}`);
    applied.push({ station: station.name, number: formatted, url: fetched.url });

    if (APPLY) {
      const key = stationProvenanceKey(station);
      station.custodyPhone = formatted;
      if (!provenance[key]) provenance[key] = {};
      provenance[key].custodyPhone = {
        number: formatted,
        source: fetched.url,
        verifiedAt: today,
        confidence: 'high',
      };
      verification[key] = {
        ...verification[key],
        fields: {
          ...verification[key]?.fields,
          custodyPhone: {
            status: 'verified',
            sourceUrl: fetched.url,
            notes: 'PSR custody row (labelled)',
          },
        },
      };
    }
  }

  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = resolve(REPORTS_DIR, `psr-topup-${today}.json`);
  writeFileSync(
    reportPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), applied, count: applied.length }, null, 2) + '\n',
  );
  console.log(`\nReport: ${reportPath}`);
  console.log(`Safe candidates: ${applied.length}`);

  if (APPLY && applied.length) {
    writeFileSync(STATIONS_PATH, JSON.stringify(stations, null, 2) + '\n');
    savePhoneProvenance(provenance);
    saveStationVerification(verification);
    console.log('Applied to stations.json');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
