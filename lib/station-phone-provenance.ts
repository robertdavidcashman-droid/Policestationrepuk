import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export type PhoneProvenanceConfidence = 'high' | 'medium' | 'low';

export interface PhoneProvenanceEntry {
  number: string;
  source: string;
  verifiedAt: string;
  confidence: PhoneProvenanceConfidence;
  field: 'custodyPhone' | 'custodyPhone2' | 'phone' | 'nonEmergencyPhone';
}

export type StationPhoneProvenanceFile = Record<
  string,
  Partial<Record<'custodyPhone' | 'custodyPhone2', PhoneProvenanceEntry>>
>;

const DEFAULT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../data/station-phone-provenance.json',
);

export function loadPhoneProvenance(path = DEFAULT_PATH): StationPhoneProvenanceFile {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, 'utf-8')) as StationPhoneProvenanceFile;
}

export function savePhoneProvenance(
  data: StationPhoneProvenanceFile,
  path = DEFAULT_PATH,
): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

export function stationProvenanceKey(station: { id?: string; stationId?: string; slug: string }): string {
  return station.stationId?.trim() || station.id?.trim() || station.slug;
}
