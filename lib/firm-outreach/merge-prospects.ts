import type { LaaProviderRecord } from '@/lib/legal-directory/laa-seed';
import type { DsccRegisterEntry } from '@/lib/dscc-register-lookup';
import {
  COMPETITOR_KEYWORDS,
  EXCLUDED_FIRM_PATTERNS,
  FIRM_OUTREACH_CAMPAIGN_ID,
} from './constants';
import {
  firmKeyFromParts,
  isEnglandWalesPostcode,
  normalizeFirmName,
  prospectIdFromKey,
} from './normalize';
import { resolveStatusWithQualification, type CrimeRegistry, isOnCrimeRegistry } from './qualification';
import type { FirmProspect, FirmProspectSource, FirmProspectStatus, FirmProspectType } from './types';

export interface RawProspectInput {
  prospectType: FirmProspectType;
  firmName: string;
  contactName?: string;
  title?: string;
  forename?: string;
  surname?: string;
  town?: string;
  county?: string;
  postcode?: string;
  phone?: string;
  websiteUrl?: string;
  regulatoryNumber?: string;
  email?: string;
  emailConfidence?: FirmProspect['emailConfidence'];
  emailScore?: number;
  source: FirmProspectSource;
  priorityBoost?: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function shouldExcludeFirm(firmName: string, websiteUrl?: string): string | null {
  for (const pat of EXCLUDED_FIRM_PATTERNS) {
    if (pat.test(firmName)) return 'excluded_government_or_cps';
  }
  const blob = `${firmName} ${websiteUrl ?? ''}`.toLowerCase();
  for (const kw of COMPETITOR_KEYWORDS) {
    if (blob.includes(kw)) return 'excluded_competitor_agency';
  }
  return null;
}

export function buildProspectFromInput(input: RawProspectInput): FirmProspect | null {
  const firmName = input.firmName?.trim();
  if (!firmName) return null;
  if (!isEnglandWalesPostcode(input.postcode)) return null;

  const excluded = shouldExcludeFirm(firmName, input.websiteUrl);
  const firmKey = firmKeyFromParts(firmName, input.postcode, input.town);
  const idKey =
    input.prospectType === 'solicitor' && input.surname
      ? `${firmKey}:${input.forename ?? ''}:${input.surname}`
      : input.regulatoryNumber
        ? `sra:${input.regulatoryNumber}`
        : firmKey;

  const priorityScore =
    (input.priorityBoost ?? 0) +
    (input.source === 'laa' ? 30 : 0) +
    (input.source === 'dscc' ? 20 : 0) +
    (input.source === 'directory' ? 40 : 0) +
    (input.email ? 15 : 0);

  const email = input.email?.trim().toLowerCase();
  const sources = [input.source];
  const baseStatus: FirmProspectStatus = excluded ? 'excluded' : 'discovered';
  const preferred: FirmProspectStatus =
    excluded ? 'excluded' : email ? 'ready_to_send' : 'discovered';

  const prospect: FirmProspect = {
    id: prospectIdFromKey(idKey),
    prospectType: input.prospectType,
    firmName,
    firmKey,
    contactName: input.contactName,
    title: input.title,
    forename: input.forename,
    surname: input.surname,
    town: input.town,
    county: input.county,
    postcode: input.postcode,
    phone: input.phone,
    websiteUrl: input.websiteUrl,
    regulatoryNumber: input.regulatoryNumber,
    email,
    emailConfidence: input.emailConfidence,
    emailScore: input.emailScore,
    sources,
    status: resolveStatusWithQualification(
      {
        prospectType: input.prospectType,
        sources,
        status: baseStatus,
        excludedReason: excluded ?? undefined,
        email,
        firmName,
        regulatoryNumber: input.regulatoryNumber,
      },
      preferred,
    ),
    priorityScore,
    excludedReason: excluded ?? undefined,
    sequenceStep: 0,
    campaignId: FIRM_OUTREACH_CAMPAIGN_ID,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    enrichAttempts: 0,
  };

  return prospect;
}

export function mergeProspect(existing: FirmProspect, incoming: FirmProspect): FirmProspect {
  const sources = [...new Set([...existing.sources, ...incoming.sources])];
  const merged: FirmProspect = {
    ...existing,
    town: existing.town || incoming.town,
    county: existing.county || incoming.county,
    postcode: existing.postcode || incoming.postcode,
    phone: existing.phone || incoming.phone,
    websiteUrl: existing.websiteUrl || incoming.websiteUrl,
    regulatoryNumber: existing.regulatoryNumber || incoming.regulatoryNumber,
    contactName: existing.contactName || incoming.contactName,
    title: existing.title || incoming.title,
    forename: existing.forename || incoming.forename,
    surname: existing.surname || incoming.surname,
    sources,
    priorityScore: Math.max(existing.priorityScore, incoming.priorityScore),
    updatedAt: nowIso(),
  };

  if (!merged.email && incoming.email) {
    merged.email = incoming.email;
    merged.emailConfidence = incoming.emailConfidence;
    merged.emailScore = incoming.emailScore;
  }

  const outreachMutable = ['discovered', 'no_email', 'enriched', 'enriching', 'ready_to_send'];
  if (outreachMutable.includes(merged.status) && merged.email) {
    merged.status = resolveStatusWithQualification(merged, 'ready_to_send');
  }

  return merged;
}

export function laaRecordsToInputs(records: LaaProviderRecord[]): RawProspectInput[] {
  return records
    .filter((r) => isEnglandWalesPostcode(r.postcode))
    .map((r) => ({
      prospectType: 'firm' as const,
      firmName: r.firmName,
      town: r.town,
      county: r.county,
      postcode: r.postcode,
      phone: r.phone,
      source: 'laa' as const,
      priorityBoost: 0,
    }));
}

export function dsccEntriesToInputs(entries: DsccRegisterEntry[]): RawProspectInput[] {
  const firms = new Map<string, RawProspectInput>();
  const solicitors: RawProspectInput[] = [];

  for (const e of entries) {
    const firm = e.firm?.trim();
    if (!firm) continue;
    const firmKey = normalizeFirmName(firm);
    if (!firms.has(firmKey)) {
      firms.set(firmKey, {
        prospectType: 'firm',
        firmName: firm,
        source: 'dscc',
        priorityBoost: 10,
      });
    }
    if (e.surname?.trim()) {
      solicitors.push({
        prospectType: 'solicitor',
        firmName: firm,
        title: e.title,
        forename: e.forename,
        surname: e.surname,
        contactName: [e.title, e.forename, e.surname].filter(Boolean).join(' ').trim(),
        source: 'dscc',
        priorityBoost: 5,
      });
    }
  }

  return [...firms.values(), ...solicitors];
}

export interface ArchiveLawFirm {
  name: string;
  sraNumber?: string;
  address?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  website?: string;
  county?: string;
  region?: string;
  criminalLawPractice?: boolean;
  policeStationWork?: boolean;
}

export function archiveFirmsToInputs(
  rows: ArchiveLawFirm[],
  registry: CrimeRegistry,
): RawProspectInput[] {
  return rows
    .filter((r) => isEnglandWalesPostcode(r.postcode))
    .filter((r) => isOnCrimeRegistry(r.name, registry, r.sraNumber))
    .map((r) => {
      const norm = normalizeFirmName(r.name);
      const onLaa = Boolean(norm && registry.laaFirmNames.has(norm));
      return {
        prospectType: 'firm' as const,
        firmName: r.name,
        county: r.county,
        postcode: r.postcode,
        phone: r.phone,
        websiteUrl: r.website,
        regulatoryNumber: r.sraNumber,
        email: r.email,
        emailConfidence: 'verified' as const,
        emailScore: 85,
        source: (onLaa ? 'laa' : 'dscc') as FirmProspectSource,
        priorityBoost: r.policeStationWork ? 15 : 5,
      };
    });
}
