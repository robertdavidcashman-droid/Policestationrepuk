import { readFileSync } from 'fs';
import { resolve } from 'path';
import { namesLikelyMatch } from '@/lib/name-match';
import { ensureDsccRegisterCache } from '@/lib/dscc-register-lookup';
import { readLaaCrimeJson } from '@/lib/legal-directory/laa-fetch';
import {
  buildProspectFromInput,
  mergeProspect,
  type RawProspectInput,
} from './merge-prospects';
import { firmKeyFromParts, normalizeFirmName } from './normalize';
import { buildCrimeRegistry, isOnCrimeRegistry, resolveStatusWithQualification } from './qualification';
import {
  getProspect,
  isDuplicateInitialSend,
  listAllProspectIds,
  listProspectsForFirmKey,
  saveProspect,
} from './storage';
import type { EmailConfidence, FirmProspect, FirmProspectSource } from './types';

export const DEFAULT_LEAD_ENGINE_CSV = resolve(
  process.cwd(),
  'lead_engine/data/exports/ready_to_send.csv',
);

export interface LeadEngineCsvRow {
  firm_name: string;
  contact_name?: string;
  contact_role?: string;
  email: string;
  email_type?: string;
  source_type?: string;
  source_provider?: string;
  website?: string;
  source_url?: string;
  town?: string;
  county?: string;
  criminal_relevance_score?: string;
  contact_relevance_score?: string;
  status?: string;
}

export interface LeadEngineImportStats {
  csvPath: string;
  rowsRead: number;
  skippedNoEmail: number;
  skippedGuessed: number;
  matched: number;
  created: number;
  updated: number;
  readyToSend: number;
  excluded: number;
  duplicateEmail: number;
  dryRun: boolean;
}

/** Minimal RFC-style CSV parser (handles quoted fields with commas). */
export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      field = '';
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else if (ch !== '\r') {
      field += ch;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    if (row.some((c) => c.trim())) rows.push(row);
  }

  return rows;
}

export function csvRowsToObjects(text: string): LeadEngineCsvRow[] {
  const matrix = parseCsvText(text);
  if (matrix.length < 2) return [];

  const headers = matrix[0].map((h) => h.trim().toLowerCase());
  const out: LeadEngineCsvRow[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r];
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (cells[i] ?? '').trim();
    });
    if (obj.firm_name && obj.email) out.push(obj as LeadEngineCsvRow);
  }

  return out;
}

export function mapLeadEngineEmailConfidence(row: LeadEngineCsvRow): EmailConfidence {
  const sourceType = (row.source_type ?? '').toLowerCase();
  const sourceProvider = (row.source_provider ?? '').toLowerCase();
  const emailType = (row.email_type ?? '').toLowerCase();

  if (sourceType.includes('paid') || sourceProvider.includes('hunter')) return 'paid_api';
  if (sourceType.includes('archive')) return 'verified';
  if (emailType === 'guessed') return 'guessed';
  return 'crawled';
}

export function leadEngineRowToInput(
  row: LeadEngineCsvRow,
  source: FirmProspectSource,
): RawProspectInput | null {
  const firmName = row.firm_name?.trim();
  const email = row.email?.trim().toLowerCase();
  if (!firmName || !email || !email.includes('@')) return null;

  const criminalScore = Number(row.criminal_relevance_score ?? 0) || 0;
  const contactScore = Number(row.contact_relevance_score ?? 0) || 0;
  const scoreBase = Math.max(criminalScore, contactScore, 65);

  return {
    prospectType: 'firm',
    firmName,
    town: row.town?.trim() || undefined,
    county: row.county?.trim() || undefined,
    websiteUrl: row.website?.trim() || undefined,
    email,
    emailConfidence: mapLeadEngineEmailConfidence(row),
    emailScore: Math.min(95, scoreBase),
    source,
    priorityBoost: 25,
  };
}

function candidateFirmKeys(row: LeadEngineCsvRow): string[] {
  const name = row.firm_name.trim();
  const town = row.town?.trim();
  const county = row.county?.trim();
  return [...new Set([firmKeyFromParts(name, undefined, town), firmKeyFromParts(name, undefined, county)])];
}

export async function findProspectForLeadEngineRow(
  row: LeadEngineCsvRow,
  nameIndex?: Map<string, FirmProspect[]>,
): Promise<FirmProspect | null> {
  for (const key of candidateFirmKeys(row)) {
    const matches = await listProspectsForFirmKey(key);
    for (const p of matches) {
      if (namesLikelyMatch(row.firm_name, p.firmName)) return p;
    }
  }

  if (nameIndex) {
    const norm = normalizeFirmName(row.firm_name);
    const candidates = nameIndex.get(norm) ?? [];
    for (const p of candidates) {
      if (namesLikelyMatch(row.firm_name, p.firmName)) return p;
    }
  }

  return null;
}

async function buildNameIndex(): Promise<Map<string, FirmProspect[]>> {
  const index = new Map<string, FirmProspect[]>();
  const ids = await listAllProspectIds();
  for (const id of ids) {
    const p = await getProspect(id);
    if (!p) continue;
    const norm = normalizeFirmName(p.firmName);
    const list = index.get(norm) ?? [];
    list.push(p);
    index.set(norm, list);
  }
  return index;
}

export async function importLeadEngineCsv(
  csvPath: string,
  opts?: { dryRun?: boolean; includeGuessed?: boolean },
): Promise<LeadEngineImportStats> {
  const dryRun = opts?.dryRun ?? false;
  const abs = resolve(csvPath);
  const text = readFileSync(abs, 'utf-8');
  const rows = csvRowsToObjects(text);

  const laa = readLaaCrimeJson();
  const dscc = await ensureDsccRegisterCache();
  const registry = buildCrimeRegistry(laa, dscc?.entries ?? []);
  const nameIndex = await buildNameIndex();

  const stats: LeadEngineImportStats = {
    csvPath: abs,
    rowsRead: rows.length,
    skippedNoEmail: 0,
    skippedGuessed: 0,
    matched: 0,
    created: 0,
    updated: 0,
    readyToSend: 0,
    excluded: 0,
    duplicateEmail: 0,
    dryRun,
  };

  for (const row of rows) {
    const email = row.email?.trim().toLowerCase();
    if (!email?.includes('@')) {
      stats.skippedNoEmail++;
      continue;
    }

    const confidence = mapLeadEngineEmailConfidence(row);
    if (confidence === 'guessed' && !opts?.includeGuessed) {
      stats.skippedGuessed++;
      continue;
    }

    const onRegistry = isOnCrimeRegistry(row.firm_name, registry);
    const source: FirmProspectSource = onRegistry ? 'laa' : 'manual';
    const input = leadEngineRowToInput(row, source);
    if (!input) {
      stats.skippedNoEmail++;
      continue;
    }

    const built = buildProspectFromInput(input);
    if (!built) continue;

    const existing = (await findProspectForLeadEngineRow(row, nameIndex)) ?? (await getProspect(built.id));

    if (existing) {
      stats.matched++;
      const merged = mergeProspect(existing, built);
      if (!existing.email && built.email) {
        merged.email = built.email;
        merged.emailConfidence = built.emailConfidence;
        merged.emailScore = built.emailScore;
      }
      merged.status = resolveStatusWithQualification(merged, 'ready_to_send');
      if (
        merged.status === 'ready_to_send' &&
        (await isDuplicateInitialSend(merged.email!, merged.id))
      ) {
        merged.status = 'excluded';
        merged.excludedReason = 'duplicate_email';
        stats.duplicateEmail++;
      }
      if (merged.status === 'ready_to_send') stats.readyToSend++;
      if (merged.status === 'excluded') stats.excluded++;
      if (!dryRun) await saveProspect(merged, existing.status);
      stats.updated++;
      continue;
    }

    built.status = resolveStatusWithQualification(built, 'ready_to_send');
    if (
      built.status === 'ready_to_send' &&
      (await isDuplicateInitialSend(built.email!, built.id))
    ) {
      built.status = 'excluded';
      built.excludedReason = 'duplicate_email';
      stats.duplicateEmail++;
    }
    if (built.status === 'ready_to_send') stats.readyToSend++;
    if (built.status === 'excluded') stats.excluded++;

    if (!dryRun) await saveProspect(built);
    stats.created++;
  }

  return stats;
}
