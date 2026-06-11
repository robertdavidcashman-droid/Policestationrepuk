import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ensureDsccRegisterCache } from '@/lib/dscc-register-lookup';
import { readLaaCrimeJson } from '@/lib/legal-directory/laa-fetch';
import { listApprovedListings } from '@/lib/legal-directory/storage';
import { countyAllowlist } from '../constants';
import {
  archiveFirmsToInputs,
  buildProspectFromInput,
  dsccEntriesToInputs,
  laaRecordsToInputs,
  mergeProspect,
  type ArchiveLawFirm,
  type RawProspectInput,
} from '../merge-prospects';
import { buildCrimeRegistry } from '../qualification';
import { getProspect, saveProspect } from '../storage';
import type { DiscoveryRunStats } from '../types';

const ARCHIVE_PATH = resolve(process.cwd(), 'data/archive/law-firms.json');

function loadArchiveFirms(): ArchiveLawFirm[] {
  try {
    return JSON.parse(readFileSync(ARCHIVE_PATH, 'utf-8')) as ArchiveLawFirm[];
  } catch {
    return [];
  }
}

function countyAllowed(county: string | undefined): boolean {
  const allow = countyAllowlist();
  if (!allow?.length) return true;
  const c = (county ?? '').trim().toLowerCase();
  if (!c) return true;
  return allow.some((a) => c.includes(a) || a.includes(c));
}

function filterByCounty(inputs: RawProspectInput[]): RawProspectInput[] {
  return inputs.filter((i) => countyAllowed(i.county));
}

async function directoryInputs(): Promise<RawProspectInput[]> {
  try {
    const listings = await listApprovedListings();
    return listings
      .filter((l) => l.categorySlug === 'solicitors' || l.categorySlug === 'prison-law')
      .map((l) => ({
        prospectType: 'firm' as const,
        firmName: l.businessName,
        town: l.town,
        county: l.county,
        postcode: l.postcode,
        phone: l.phone,
        websiteUrl: l.websiteUrl,
        regulatoryNumber: l.regulatoryNumber,
        email: l.ownerEmail || l.email,
        emailConfidence: 'directory' as const,
        emailScore: 90,
        source: 'directory' as const,
        priorityBoost: 40,
      }))
      .filter((i) => i.email?.trim());
  } catch (err) {
    console.warn('[firm-outreach] directory import skipped:', err);
    return [];
  }
}

export async function runFirmDiscovery(): Promise<DiscoveryRunStats> {
  const started = Date.now();
  const laa = readLaaCrimeJson();
  const archive = loadArchiveFirms();
  const dscc = await ensureDsccRegisterCache();
  const directory = await directoryInputs();

  const dsccInputs = dscc?.entries?.length ? dsccEntriesToInputs(dscc.entries) : [];
  const dsccFirms = dsccInputs.filter((i) => i.prospectType === 'firm').length;
  const dsccSolicitors = dsccInputs.filter((i) => i.prospectType === 'solicitor').length;
  const crimeRegistry = buildCrimeRegistry(laa, dscc?.entries ?? []);
  const archiveInputs = archiveFirmsToInputs(archive, crimeRegistry);

  const allInputs = filterByCounty([
    ...laaRecordsToInputs(laa),
    ...archiveInputs,
    ...dsccInputs,
    ...directory,
  ]);

  let created = 0;
  let updated = 0;
  let excluded = 0;

  for (const input of allInputs) {
    const built = buildProspectFromInput(input);
    if (!built) continue;
    if (built.status === 'excluded') excluded++;

    const existing = await getProspect(built.id);
    if (!existing) {
      await saveProspect(built);
      created++;
      continue;
    }
    const merged = mergeProspect(existing, built);
    await saveProspect(merged, existing.status);
    updated++;
  }

  return {
    laaRows: laa.length,
    dsccFirms,
    dsccSolicitors,
    archiveRows: archiveInputs.length,
    archiveSkipped: archive.length - archiveInputs.length,
    directoryRows: directory.length,
    created,
    updated,
    excluded,
    elapsedMs: Date.now() - started,
  };
}
