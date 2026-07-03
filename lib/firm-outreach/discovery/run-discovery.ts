import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ensureDsccRegisterCache } from '@/lib/dscc-register-lookup';
import { readLaaCrimeJson } from '@/lib/legal-directory/laa-fetch';
import { listApprovedListings } from '@/lib/legal-directory/storage';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '../campaign-scope';
import { countyAllowlist } from '../constants';
import { filterKentInputs } from '../kent-filter';
import {
  archiveFirmsToInputs,
  buildProspectForCampaign,
  buildProspectFromInput,
  dsccEntriesToInputs,
  laaRecordsToInputs,
  mergeProspect,
  type ArchiveLawFirm,
  type RawProspectInput,
} from '../merge-prospects';
import { FIRM_OUTREACH_CAMPAIGN_ID } from '../site-config';
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

function countyAllowed(county: string | undefined, allowlist: string[] | null): boolean {
  if (!allowlist?.length) return true;
  const c = (county ?? '').trim().toLowerCase();
  if (!c) return true;
  return allowlist.some((a) => c.includes(a) || a.includes(c));
}

function filterByCounty(
  inputs: RawProspectInput[],
  allowlist: string[] | null,
): RawProspectInput[] {
  return inputs.filter((i) => countyAllowed(i.county, allowlist));
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

export async function runFirmDiscovery(opts?: {
  campaignId?: string;
  countyAllowlist?: string[] | null;
}): Promise<DiscoveryRunStats> {
  const started = Date.now();
  const campaignId = opts?.campaignId ?? FIRM_OUTREACH_CAMPAIGN_ID;
  const isAgentCover = campaignId === AGENT_COVER_KENT_CAMPAIGN_ID;
  const allowlist = isAgentCover
    ? (opts?.countyAllowlist ?? ['kent'])
    : (opts?.countyAllowlist ?? countyAllowlist());

  const laa = readLaaCrimeJson();
  const archive = loadArchiveFirms();
  const dscc = await ensureDsccRegisterCache();
  const directory = await directoryInputs();

  const dsccInputs = dscc?.entries?.length ? dsccEntriesToInputs(dscc.entries) : [];
  const dsccFirms = dsccInputs.filter((i) => i.prospectType === 'firm').length;
  const dsccSolicitors = dsccInputs.filter((i) => i.prospectType === 'solicitor').length;
  const crimeRegistry = buildCrimeRegistry(laa, dscc?.entries ?? []);
  const archiveInputs = archiveFirmsToInputs(archive, crimeRegistry);

  let allInputs = filterByCounty(
    [...laaRecordsToInputs(laa), ...archiveInputs, ...dsccInputs, ...directory],
    allowlist,
  );
  if (isAgentCover) {
    allInputs = filterKentInputs(allInputs);
  }

  let created = 0;
  let updated = 0;
  let excluded = 0;

  for (const input of allInputs) {
    const built = isAgentCover
      ? buildProspectForCampaign(campaignId, input)
      : buildProspectFromInput(input);
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
