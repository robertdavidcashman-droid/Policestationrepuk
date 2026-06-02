/**
 * Audit and correct station telephone numbers against official force contacts.
 * Run: npx tsx scripts/correct-station-phones.ts [--write]
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_NON_EMERGENCY,
  getOfficialContact,
  OFFICIAL_FORCE_CONTACTS,
} from '../lib/official-force-contacts';
import {
  formatPhoneUk,
  isPlausibleUkPhoneField,
  normalizePhoneDigits,
  phonesEquivalent,
} from '../lib/phone-format';
import { normalizePhone } from '../lib/station-search';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIONS_PATH = resolve(__dirname, '../data/stations.json');
const WRITE = process.argv.includes('--write');

type Station = {
  name: string;
  forceName?: string;
  phone?: string;
  custodyPhone?: string;
  custodyPhone2?: string;
  nonEmergencyPhone?: string;
  [key: string]: unknown;
};

const PHONE_FIELDS = ['phone', 'custodyPhone', 'custodyPhone2', 'nonEmergencyPhone'] as const;

/** Stations where published guidance says there is no public direct line (use 101). */
const NO_PUBLIC_DIRECT_LINE_SLUGS = new Set(['tonbridge-police-station']);

const INTERNATIONAL_DIGITS = new Set<string>();
for (const c of Object.values(OFFICIAL_FORCE_CONTACTS)) {
  if (c.international) INTERNATIONAL_DIGITS.add(normalizePhoneDigits(c.international));
}

function targetNonEmergency(forceName: string | undefined): string {
  return getOfficialContact(forceName)?.nonEmergency ?? DEFAULT_NON_EMERGENCY;
}

function isInternationalLegacy(digits: string): boolean {
  return INTERNATIONAL_DIGITS.has(digits);
}

function formatField(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed === '101') return '101';
  return formatPhoneUk(trimmed) || trimmed;
}

function correctStation(s: Station): string[] {
  const changes: string[] = [];
  const force = s.forceName?.trim() || '';
  const official = getOfficialContact(force);
  const targetNe = targetNonEmergency(force);

  for (const field of PHONE_FIELDS) {
    const raw = (s[field] as string | undefined)?.trim();
    if (!raw) continue;
    if (!isPlausibleUkPhoneField(raw)) {
      if (WRITE) (s as Record<string, string>)[field] = field === 'nonEmergencyPhone' ? targetNe : '';
      changes.push(`${field}: removed invalid/non-numeric content`);
      continue;
    }
    const formatted = formatField(raw);
    if (formatted !== raw) {
      if (WRITE) (s as Record<string, string>)[field] = formatted;
      changes.push(`${field}: format "${raw}" → "${formatted}"`);
    }
  }

  const phoneDigits = normalizePhoneDigits(s.phone || '');
  const neDigits = normalizePhoneDigits(s.nonEmergencyPhone || '');

  if (s.phone?.trim() === '101' || phoneDigits === '101') {
    if (WRITE) s.phone = '';
    changes.push('phone: removed 101 (use non-emergency field)');
  }

  if (official?.international && s.phone && phonesEquivalent(s.phone, official.international)) {
    if (WRITE) s.phone = '';
    changes.push(`phone: removed force international line (UK callers use ${targetNe})`);
  }

  if (force === 'Kent Police' && s.phone?.trim().startsWith('+44')) {
    if (WRITE) s.phone = '';
    changes.push('phone: removed unverified +44 import (Kent public contact is 101)');
  }

  const slug = (s.slug as string | undefined)?.trim();
  if (slug && NO_PUBLIC_DIRECT_LINE_SLUGS.has(slug) && s.phone?.trim()) {
    if (WRITE) s.phone = '';
    changes.push('phone: removed — no published public station line (use 101)');
  }

  if (s.nonEmergencyPhone) {
    const ne = s.nonEmergencyPhone.trim();
    if (
      (official?.international && phonesEquivalent(ne, official.international)) ||
      (isInternationalLegacy(neDigits) && targetNe === DEFAULT_NON_EMERGENCY)
    ) {
      if (WRITE) s.nonEmergencyPhone = targetNe;
      changes.push(`nonEmergencyPhone: legacy international → ${targetNe}`);
    }
  }

  if (!s.nonEmergencyPhone?.trim()) {
    if (WRITE) s.nonEmergencyPhone = targetNe;
    changes.push(`nonEmergencyPhone: set to ${targetNe}`);
  } else if (
    force === 'British Transport Police' &&
    normalizePhoneDigits(s.nonEmergencyPhone) === '101'
  ) {
    const btp = targetNonEmergency(force);
    if (WRITE) s.nonEmergencyPhone = btp;
    changes.push(`nonEmergencyPhone: BTP public line is ${btp}`);
  } else if (
    normalizePhoneDigits(s.nonEmergencyPhone) === '101' &&
    s.nonEmergencyPhone.trim() !== '101'
  ) {
    if (WRITE) s.nonEmergencyPhone = '101';
    changes.push('nonEmergencyPhone: normalised to 101');
  }

  if (phoneDigits && neDigits && phoneDigits === neDigits && phoneDigits !== '101') {
    // Keep one field; prefer non-emergency for generic/switchboard duplicates
    if (WRITE) s.phone = '';
    changes.push('phone: removed duplicate of non-emergency number');
  }

  return changes;
}

const stations: Station[] = JSON.parse(readFileSync(STATIONS_PATH, 'utf-8'));
const report: Array<{ name: string; force: string; changes: string[] }> = [];

for (const s of stations) {
  const changes = correctStation(s);
  if (changes.length) {
    report.push({ name: s.name, force: s.forceName || '', changes });
  }
}

console.log(`Mode: ${WRITE ? 'WRITE' : 'dry-run'}`);
console.log(`Stations with corrections: ${report.length} / ${stations.length}\n`);

const byKind = new Map<string, number>();
for (const { changes } of report) {
  for (const c of changes) {
    const kind = c.split(':')[0];
    byKind.set(kind, (byKind.get(kind) || 0) + 1);
  }
}
console.log('Change summary:');
for (const [k, n] of [...byKind.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${n}`);
}

if (report.length <= 40) {
  for (const r of report) {
    console.log(`\n${r.name} (${r.force})`);
    r.changes.forEach((c) => console.log(`  - ${c}`));
  }
} else {
  console.log('\nSample (first 25):');
  for (const r of report.slice(0, 25)) {
    console.log(`${r.name}: ${r.changes.join('; ')}`);
  }
}

if (WRITE) {
  writeFileSync(STATIONS_PATH, JSON.stringify(stations, null, 2) + '\n');
  console.log('\nWrote', STATIONS_PATH);
} else {
  console.log('\nDry-run only. Re-run with --write to apply.');
}
