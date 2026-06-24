import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { PoliceStation } from './types';
export { isDialablePhone } from './station-phone-dialable';
import {
  loadPhoneProvenance,
  type PhoneProvenanceEntry,
  type StationPhoneProvenanceFile,
} from './station-phone-provenance';

export type FieldVerificationStatus = 'verified' | 'unverified' | 'not_publicly_listed';

export interface FieldVerification {
  status: FieldVerificationStatus;
  sourceUrl?: string;
  dateVerified?: string;
  notes?: string;
}

export type StationVerificationFieldKey =
  | 'phone'
  | 'custodyPhone'
  | 'custodyPhone2'
  | 'address'
  | 'custodyStatus'
  | 'frontCounterStatus'
  | 'email'
  | 'openingHours';

export interface StationVerificationRecord {
  sourceUrl?: string;
  secondarySourceUrl?: string;
  dateVerified?: string;
  verificationStatus?: 'verified' | 'unverified' | 'partial';
  fields?: Partial<Record<StationVerificationFieldKey, FieldVerification>>;
}

export type StationVerificationFile = Record<string, StationVerificationRecord>;

const DEFAULT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../data/station-verification.json',
);

let _cache: StationVerificationFile | null = null;

export function stationVerificationKey(station: {
  id?: string;
  stationId?: string;
  slug: string;
}): string {
  return station.stationId?.trim() || station.id?.trim() || station.slug;
}

export function loadStationVerification(path = DEFAULT_PATH): StationVerificationFile {
  if (_cache && path === DEFAULT_PATH) return _cache;
  if (!existsSync(path)) {
    if (path === DEFAULT_PATH) _cache = {};
    return {};
  }
  const data = JSON.parse(readFileSync(path, 'utf-8')) as StationVerificationFile;
  if (path === DEFAULT_PATH) _cache = data;
  return data;
}

export function saveStationVerification(
  data: StationVerificationFile,
  path = DEFAULT_PATH,
): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  if (path === DEFAULT_PATH) _cache = data;
}

export function clearStationVerificationCache(): void {
  _cache = null;
}

function provenanceEntryToFieldVerification(entry: PhoneProvenanceEntry): FieldVerification {
  const status: FieldVerificationStatus =
    entry.confidence === 'high' ? 'verified' : entry.confidence === 'low' ? 'unverified' : 'verified';
  return {
    status,
    sourceUrl: entry.source.startsWith('http') ? entry.source : undefined,
    dateVerified: entry.verifiedAt,
    notes: entry.source.startsWith('http') ? undefined : entry.source,
  };
}

/** Merge legacy phone provenance into verification records (idempotent). */
export function migratePhoneProvenanceToVerification(
  provenance: StationPhoneProvenanceFile = loadPhoneProvenance(),
  verification: StationVerificationFile = loadStationVerification(),
): StationVerificationFile {
  const out = { ...verification };
  for (const [key, row] of Object.entries(provenance)) {
    const existing = out[key] ?? {};
    const fields = { ...existing.fields };
    for (const field of ['custodyPhone', 'custodyPhone2'] as const) {
      const entry = row[field];
      if (entry && !fields[field]) {
        fields[field] = provenanceEntryToFieldVerification(entry);
      }
    }
    const dates = Object.values(fields)
      .map((f) => f?.dateVerified)
      .filter(Boolean) as string[];
    out[key] = {
      ...existing,
      fields,
      verificationStatus: existing.verificationStatus ?? 'partial',
      dateVerified: existing.dateVerified ?? dates.sort().at(-1),
    };
  }
  return out;
}

export function getStationVerificationRecord(
  station: PoliceStation,
  file: StationVerificationFile = loadStationVerification(),
): StationVerificationRecord | null {
  const key = stationVerificationKey(station);
  return file[key] ?? null;
}

export function applyStationVerificationMeta(
  stations: PoliceStation[],
  file: StationVerificationFile = loadStationVerification(),
): PoliceStation[] {
  return stations.map((s) => {
    const rec = getStationVerificationRecord(s, file);
    if (!rec) return s;
    return {
      ...s,
      verificationMeta: {
        verificationStatus: rec.verificationStatus ?? 'partial',
        dateVerified: rec.dateVerified,
        sourceUrl: rec.sourceUrl,
        secondarySourceUrl: rec.secondarySourceUrl,
        fields: rec.fields,
      },
    };
  });
}

