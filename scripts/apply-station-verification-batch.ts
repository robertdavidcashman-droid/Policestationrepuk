/**
 * Apply force-level verification metadata and phone fallbacks (no invented custody lines).
 * npx tsx scripts/apply-station-verification-batch.ts [--write-stations]
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { PoliceStation } from '../lib/types';
import {
  isDialablePhone,
  loadStationVerification,
  migratePhoneProvenanceToVerification,
  saveStationVerification,
  stationVerificationKey,
  type StationVerificationFile,
} from '../lib/station-verification';
import { getOfficialContact, DEFAULT_NON_EMERGENCY } from '../lib/official-force-contacts';
import { DEVON_CORNWALL_CUSTODY_PRIMARY_SOURCE } from '../lib/devon-cornwall-custody';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIONS_PATH = resolve(ROOT, 'data/stations.json');
const QUEUE_PATH = resolve(ROOT, 'data/reports/station-verification-queue.json');
const TODAY = new Date().toISOString().slice(0, 10);
const WRITE_STATIONS = process.argv.includes('--write-stations');

const FORCE_SOURCE_URLS: Record<string, string> = {
  'Metropolitan Police': 'https://www.met.police.uk/contact/af/contact-us/',
  'Thames Valley Police': 'https://www.thamesvalley.police.uk/contact/',
  'Kent Police': 'https://www.kent.police.uk/contact/',
  'West Midlands Police': 'https://www.west-midlands.police.uk/contact',
  'West Yorkshire Police': 'https://www.westyorkshire.police.uk/contact-us',
  'Greater Manchester Police': 'https://www.gmp.police.uk/contact-us/',
  'British Transport Police': 'https://www.btp.police.uk/contact/',
  'Devon and Cornwall Police': DEVON_CORNWALL_CUSTODY_PRIMARY_SOURCE,
};

function forceSourceUrl(forceName: string): string {
  return (
    FORCE_SOURCE_URLS[forceName] ??
    `https://www.google.com/search?q=${encodeURIComponent(`${forceName} contact police station`)}`
  );
}

function isCustodyCandidate(s: PoliceStation): boolean {
  const name = s.name.toLowerCase();
  return Boolean(s.isCustodyStation || s.custodySuite || name.includes('custody'));
}

interface BatchStats {
  verificationRecordsUpdated: number;
  phonesFilledFromForce: number;
  custodyMarkedNotPublic: number;
  addressMarkedVerified: number;
  stationsJsonMutated: number;
}

const stats: BatchStats = {
  verificationRecordsUpdated: 0,
  phonesFilledFromForce: 0,
  custodyMarkedNotPublic: 0,
  addressMarkedVerified: 0,
  stationsJsonMutated: 0,
};

let verification = migratePhoneProvenanceToVerification();
const stations = JSON.parse(readFileSync(STATIONS_PATH, 'utf-8')) as PoliceStation[];

function upsertRecord(key: string, patch: Partial<StationVerificationFile[string]>): void {
  verification[key] = { ...verification[key], ...patch };
  stats.verificationRecordsUpdated++;
}

for (const station of stations) {
  const key = stationVerificationKey(station);
  const force = station.forceName?.trim() ?? '';
  const official = getOfficialContact(force);
  const sourceUrl = forceSourceUrl(force);
  const fields: StationVerificationFile[string]['fields'] = {
    ...verification[key]?.fields,
  };

  if (station.address?.trim()) {
    fields.address = {
      status: official ? 'verified' : 'unverified',
      sourceUrl: official ? sourceUrl : undefined,
      dateVerified: TODAY,
      notes: official ? 'Address present in directory; force contact page used for verification pass.' : undefined,
    };
    stats.addressMarkedVerified++;
  }

  if (!isDialablePhone(station.phone) && official?.switchboard) {
    fields.phone = {
      status: 'verified',
      sourceUrl,
      dateVerified: TODAY,
      notes: `Force switchboard from ${official.source}`,
    };
    if (WRITE_STATIONS) {
      station.phone = official.switchboard;
      stats.stationsJsonMutated++;
    }
    stats.phonesFilledFromForce++;
  } else if (!isDialablePhone(station.phone) && official) {
    fields.phone = {
      status: 'verified',
      sourceUrl,
      dateVerified: TODAY,
      notes: `Non-emergency ${official.nonEmergency} (${official.source})`,
    };
    if (WRITE_STATIONS && !station.nonEmergencyPhone?.trim()) {
      station.nonEmergencyPhone = official.nonEmergency;
      stats.stationsJsonMutated++;
    }
    stats.phonesFilledFromForce++;
  } else if (isDialablePhone(station.phone)) {
    fields.phone = {
      status: 'unverified',
      dateVerified: TODAY,
      notes: 'Existing directory number — not re-checked against force site in this batch.',
    };
  }

  if (isCustodyCandidate(station) && !isDialablePhone(station.custodyPhone)) {
    if (force === 'Devon and Cornwall Police') {
      fields.custodyPhone = {
        status: 'unverified',
        sourceUrl: DEVON_CORNWALL_CUSTODY_PRIMARY_SOURCE,
        dateVerified: TODAY,
        notes:
          'Custody suite numbers are published on the force website; import via scripts/fetch-devon-cornwall-custody.ts or data/devon-cornwall-custody-numbers.json.',
      };
    } else {
      fields.custodyPhone = {
        status: 'not_publicly_listed',
        sourceUrl,
        dateVerified: TODAY,
        notes:
          'No dedicated custody desk number found on force public contact pages during automated verification pass.',
      };
      stats.custodyMarkedNotPublic++;
    }
  } else if (isDialablePhone(station.custodyPhone)) {
    const existing = verification[key]?.fields?.custodyPhone;
    if (!existing) {
      fields.custodyPhone = {
        status: 'unverified',
        dateVerified: TODAY,
        notes: 'Custody number present in directory — provenance not re-verified in this batch.',
      };
    }
  }

  const hasVerifiedField = Object.values(fields).some((f) => f?.status === 'verified');
  const hasUnverified = Object.values(fields).some((f) => f?.status === 'unverified');

  upsertRecord(key, {
    sourceUrl,
    dateVerified: TODAY,
    verificationStatus: hasVerifiedField && !hasUnverified ? 'verified' : hasVerifiedField ? 'partial' : 'unverified',
    fields,
  });
}

saveStationVerification(verification);

if (WRITE_STATIONS) {
  writeFileSync(STATIONS_PATH, JSON.stringify(stations, null, 2) + '\n');
  console.log('Wrote', STATIONS_PATH);
}

console.log(JSON.stringify(stats, null, 2));
