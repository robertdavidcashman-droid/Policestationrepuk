/**
 * Audit and remediate station telephone accuracy.
 *
 *   npx tsx scripts/verify-station-phone-accuracy.ts           # report
 *   npx tsx scripts/verify-station-phone-accuracy.ts --write   # update JSON files
 *
 * Removes legacy/unverified station-specific guesses from stations.json and
 * refreshes station-verification.json so only official or source-backed numbers remain.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { PoliceStation } from '../lib/types';
import { getOfficialContact } from '../lib/official-force-contacts';
import { phonesEquivalent } from '../lib/phone-format';
import {
  applyStationVerificationMeta,
  isDialablePhone,
  loadStationVerification,
  migratePhoneProvenanceToVerification,
  saveStationVerification,
  stationVerificationKey,
  type FieldVerification,
  type StationVerificationFile,
} from '../lib/station-verification';
import { loadPhoneProvenance, savePhoneProvenance } from '../lib/station-phone-provenance';
import {
  isAlwaysPublishableForceContact,
  isTrustedStationPhoneField,
} from '../lib/station-phone-trust';
import { stationPhoneNumbers } from '../lib/station-search';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STATIONS_PATH = resolve(ROOT, 'data/stations.json');
const REPORT_PATH = resolve(ROOT, 'data/reports/station-phone-accuracy.json');
const WRITE = process.argv.includes('--write');
const TODAY = new Date().toISOString().slice(0, 10);

const UNTRUSTED = /generate-data\.js|legacy custody seed/i;

type PhoneField = 'phone' | 'custodyPhone' | 'custodyPhone2';

function officialSourceUrl(forceName: string): string {
  const map: Record<string, string> = {
    'Metropolitan Police': 'https://www.met.police.uk/contact/af/contact-us/',
    'British Transport Police': 'https://www.btp.police.uk/contact/',
    'Kent Police': 'https://www.kent.police.uk/contact/',
    'Devon and Cornwall Police': 'https://www.devon-cornwall.police.uk/contact/custody-information/',
  };
  return map[forceName] ?? `https://www.google.com/search?q=${encodeURIComponent(`${forceName} contact`)}`;
}

function isOfficialHttp(url: string | undefined): boolean {
  return Boolean(url && /\.police\.uk|gov\.uk|btp\.police/i.test(url));
}

function recomputeVerificationField(
  station: PoliceStation,
  field: PhoneField,
  value: string | undefined,
  existing?: FieldVerification,
): FieldVerification | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !isDialablePhone(trimmed)) return undefined;

  const official = getOfficialContact(station.forceName);
  const sourceUrl = existing?.sourceUrl ?? officialSourceUrl(station.forceName ?? '');

  if (UNTRUSTED.test(existing?.notes ?? '') || UNTRUSTED.test(existing?.sourceUrl ?? '')) {
    return undefined;
  }

  if (isOfficialHttp(existing?.sourceUrl) || isOfficialHttp(sourceUrl)) {
    return {
      status: 'verified',
      sourceUrl: existing?.sourceUrl ?? sourceUrl,
      dateVerified: TODAY,
      notes: existing?.notes ?? 'Official force website source.',
    };
  }

  if (
    official &&
    (phonesEquivalent(trimmed, official.nonEmergency) ||
      (official.switchboard && phonesEquivalent(trimmed, official.switchboard)) ||
      (official.international && phonesEquivalent(trimmed, official.international)))
  ) {
    return {
      status: 'verified',
      sourceUrl,
      dateVerified: TODAY,
      notes: `Matches published force contact (${official.source}).`,
    };
  }

  return {
    status: 'unverified',
    dateVerified: TODAY,
    notes: 'Removed from public display — not verified against an official source.',
  };
}

const stations = JSON.parse(readFileSync(STATIONS_PATH, 'utf-8')) as PoliceStation[];
let verification = migratePhoneProvenanceToVerification(loadPhoneProvenance(), loadStationVerification());
const provenance = loadPhoneProvenance();

const report = {
  generatedAt: new Date().toISOString(),
  mode: WRITE ? 'write' : 'dry-run',
  cleared: { phone: 0, custodyPhone: 0, custodyPhone2: 0 },
  verified: { phone: 0, custodyPhone: 0 },
  markedUnverified: 0,
  publishableAfter: 0,
  samples: [] as Array<{ name: string; action: string }>,
};

for (const station of stations) {
  const key = stationVerificationKey(station);
  const fields = { ...verification[key]?.fields };

  for (const field of ['phone', 'custodyPhone', 'custodyPhone2'] as const) {
    const raw = station[field]?.trim();
    if (!raw || !isDialablePhone(raw)) continue;

    const existing = fields[field];

    if (UNTRUSTED.test(existing?.notes ?? '') || UNTRUSTED.test(provenance[key]?.[field as 'custodyPhone']?.source ?? '')) {
      fields[field] = {
        status: 'unverified',
        dateVerified: TODAY,
        notes: 'Legacy directory import — shown with unverified label until confirmed.',
      };
      report.markedUnverified++;
      if (report.samples.length < 20) {
        report.samples.push({ name: station.name, action: `marked ${field} unverified (legacy import): ${raw}` });
      }
      continue;
    }

    const [stationWithMeta] = applyStationVerificationMeta([station], { [key]: { ...verification[key], fields } });
    const trusted = isTrustedStationPhoneField(stationWithMeta, field, raw);
    const forceOk = isAlwaysPublishableForceContact(stationWithMeta, field, raw);

    if (!trusted && !forceOk) {
      report.markedUnverified++;
      fields[field] = {
        status: 'unverified',
        dateVerified: TODAY,
        notes: 'Shown with unverified label — not yet confirmed against an official force source.',
      };
      if (report.samples.length < 20) {
        report.samples.push({ name: station.name, action: `marked ${field} unverified: ${raw}` });
      }
      continue;
    }

    const next = recomputeVerificationField(station, field, raw, existing);
    if (next) {
      fields[field] = next;
      if (next.status === 'verified') report.verified[field as 'phone' | 'custodyPhone']++;
    }
  }

  if (!station.nonEmergencyPhone?.trim()) {
    const ne = getOfficialContact(station.forceName)?.nonEmergency ?? '101';
    if (WRITE) station.nonEmergencyPhone = ne;
  }

  const hasVerifiedField = Object.values(fields).some((f) => f?.status === 'verified');
  const hasUnverified = Object.values(fields).some((f) => f?.status === 'unverified');

  verification[key] = {
    ...verification[key],
    sourceUrl: verification[key]?.sourceUrl ?? officialSourceUrl(station.forceName ?? ''),
    dateVerified: TODAY,
    verificationStatus: hasVerifiedField && !hasUnverified ? 'verified' : hasVerifiedField ? 'partial' : 'unverified',
    fields,
  };
}

const withMeta = applyStationVerificationMeta(stations, verification);
for (const s of withMeta) {
  if (stationPhoneNumbers(s).length > 0) report.publishableAfter++;
}

mkdirSync(resolve(ROOT, 'data/reports'), { recursive: true });
writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');

if (WRITE) {
  writeFileSync(STATIONS_PATH, JSON.stringify(stations, null, 2) + '\n');
  saveStationVerification(verification);
}

console.log(JSON.stringify(report, null, 2));
console.log(`Report: ${REPORT_PATH}`);
if (!WRITE) console.log('Dry-run. Re-run with --write to apply.');
