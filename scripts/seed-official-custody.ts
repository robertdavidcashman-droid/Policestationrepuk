/**
 * Apply official force custody desk numbers from data/*-custody-numbers.json
 * files into stations.json + provenance + verification metadata.
 *
 * Also marks custody suites without a published desk line as not_publicly_listed
 * when the force contact is only 101.
 *
 * Usage:
 *   npx tsx scripts/seed-official-custody.ts              # dry-run
 *   npx tsx scripts/seed-official-custody.ts --write        # apply
 *   npx tsx scripts/seed-official-custody.ts --force="Kent Police"
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { isCustodyStation } from '../lib/custody-station';
import { formatPhoneUk, isPlausibleUkPhoneField, normalizePhoneDigits } from '../lib/phone-format';
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
  type StationVerificationFile,
} from '../lib/station-verification';
import { classifyPhone } from '../lib/station-search';
import type { PoliceStation } from '../lib/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'data');
const STATIONS_PATH = resolve(ROOT, 'data/stations.json');
const WRITE = process.argv.includes('--write');
const forceArg = process.argv.find((a) => a.startsWith('--force='));
const FORCE_FILTER = forceArg?.split('=')[1]?.trim();

type ForceCustodyFile = {
  source?: string;
  verifiedAt?: string;
  stations: Record<
    string,
    { custodyPhone: string; sourceUrl?: string; psrUrl?: string; suiteName?: string }
  >;
};

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

function loadForceFiles(): { file: string; data: ForceCustodyFile }[] {
  const out: { file: string; data: ForceCustodyFile }[] = [];
  for (const name of readdirSync(DATA_DIR)) {
    if (!name.endsWith('-custody-numbers.json')) continue;
    const path = resolve(DATA_DIR, name);
    try {
      const data = JSON.parse(readFileSync(path, 'utf-8')) as ForceCustodyFile;
      if (data.stations && typeof data.stations === 'object') {
        out.push({ file: name, data });
      }
    } catch {
      console.warn(`[seed-official] skip invalid ${name}`);
    }
  }
  return out;
}

function main(): void {
  const stations: PoliceStation[] = JSON.parse(readFileSync(STATIONS_PATH, 'utf-8'));
  const forceFiles = loadForceFiles();
  const provenance: StationPhoneProvenanceFile = loadPhoneProvenance();
  const verification: StationVerificationFile = loadStationVerification();
  const today = new Date().toISOString().slice(0, 10);

  let custodyApplied = 0;
  let markedNotPublic = 0;

  console.log(`Mode: ${WRITE ? 'WRITE' : 'dry-run'} | force files: ${forceFiles.length}`);

  for (const { file, data } of forceFiles) {
    console.log(`  loading ${file} (${Object.keys(data.stations).length} entries)`);
    for (const station of stations) {
      if (FORCE_FILTER && station.forceName !== FORCE_FILTER) continue;

      const entry =
        data.stations[station.slug] ??
        (station.stationId ? data.stations[station.stationId] : undefined);
      if (!entry?.custodyPhone || !isValidCustodyNumber(entry.custodyPhone)) continue;

      const key = stationProvenanceKey(station);
      const formatted = formatPhoneUk(entry.custodyPhone);
      const source =
        entry.sourceUrl ?? entry.psrUrl ?? data.source ?? `official:${file}`;

      if (!isDialablePhone(station.custodyPhone)) {
        console.log(`  + custody ${station.name}: ${formatted} (${source})`);
        custodyApplied++;
        if (WRITE) {
          station.custodyPhone = formatted;
          if (!provenance[key]) provenance[key] = {};
          provenance[key].custodyPhone = {
            number: formatted,
            source,
            verifiedAt: data.verifiedAt ?? today,
            confidence: 'high',
          };
          verification[key] = {
            ...verification[key],
            fields: {
              ...verification[key]?.fields,
              custodyPhone: {
                status: 'verified',
                sourceUrl: source,
                notes: `Official force custody listing (${basename(file)})`,
              },
            },
          };
        }
      }
    }
  }

  for (const station of stations) {
    if (FORCE_FILTER && station.forceName !== FORCE_FILTER) continue;
    if (!isCustodyStation(station)) continue;
    if (isDialablePhone(station.custodyPhone)) continue;

    const key = stationVerificationKey(station);
    const existing = verification[key]?.fields?.custodyPhone?.status;
    if (existing === 'verified') continue;

    console.log(`  ~ not_publicly_listed ${station.name} (${station.forceName})`);
    markedNotPublic++;
    if (WRITE) {
      verification[key] = {
        ...verification[key],
        fields: {
          ...verification[key]?.fields,
          custodyPhone: {
            status: 'not_publicly_listed',
            notes: 'No published custody desk line; contact via 101 or force switchboard.',
          },
        },
      };
    }
  }

  console.log(`\nSummary: custody applied=${custodyApplied} not_publicly_listed=${markedNotPublic}`);

  if (WRITE) {
    writeFileSync(STATIONS_PATH, JSON.stringify(stations, null, 2) + '\n');
    savePhoneProvenance(provenance);
    saveStationVerification(verification);
    console.log('Written stations.json, provenance, verification.');
  } else {
    console.log('Dry-run complete. Re-run with --write to apply.');
  }
}

main();
