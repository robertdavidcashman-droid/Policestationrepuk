import type { DsccRegisterEntry, LaaProviderRecord } from './adapters';
import { normalizeFirmName } from './normalize';
import type { FirmProspect, FirmProspectSource, FirmProspectStatus } from './types';

/** Sources that independently justify criminal-defence WhatsApp outreach. */
export const VERIFIED_CRIME_SOURCES: readonly FirmProspectSource[] = [
  'laa',
  'dscc',
  'directory',
  'manual',
];

export interface CrimeRegistry {
  laaSraNumbers: Set<string>;
  laaFirmNames: Set<string>;
  dsccFirmNames: Set<string>;
}

export function buildCrimeRegistry(
  laaRecords: LaaProviderRecord[],
  dsccEntries: DsccRegisterEntry[],
): CrimeRegistry {
  const laaSraNumbers = new Set<string>();
  const laaFirmNames = new Set<string>();
  const dsccFirmNames = new Set<string>();

  for (const r of laaRecords) {
    const name = normalizeFirmName(r.firmName);
    if (name) laaFirmNames.add(name);
  }

  for (const e of dsccEntries) {
    const firm = e.firm?.trim();
    if (!firm) continue;
    dsccFirmNames.add(normalizeFirmName(firm));
  }

  return { laaSraNumbers, laaFirmNames, dsccFirmNames };
}

export function isOnCrimeRegistry(
  firmName: string,
  registry: CrimeRegistry,
  sraNumber?: string,
): boolean {
  const norm = normalizeFirmName(firmName);
  if (norm && registry.laaFirmNames.has(norm)) return true;
  if (norm && registry.dsccFirmNames.has(norm)) return true;
  const sra = sraNumber?.trim();
  if (sra && registry.laaSraNumbers.has(sra)) return true;
  return false;
}

export function hasVerifiedCrimeSource(sources: FirmProspectSource[]): boolean {
  return sources.some((s) => VERIFIED_CRIME_SOURCES.includes(s));
}

export interface QualificationResult {
  qualified: boolean;
  reason: string;
}

type OutreachQualificationProspect = Pick<
  FirmProspect,
  | 'prospectType'
  | 'sources'
  | 'status'
  | 'excludedReason'
  | 'firmName'
  | 'regulatoryNumber'
  | 'crimeWebsiteVerified'
>;

export function qualifyProspectForOutreach(
  prospect: OutreachQualificationProspect,
  registry?: CrimeRegistry,
): QualificationResult {
  if (prospect.crimeWebsiteVerified) {
    return { qualified: true, reason: 'website_crime_verified' };
  }

  if (
    (prospect.status === 'excluded' || prospect.excludedReason) &&
    prospect.excludedReason !== 'archive_only_not_on_laa_or_dscc'
  ) {
    return { qualified: false, reason: prospect.excludedReason ?? 'excluded' };
  }

  if (prospect.prospectType === 'solicitor') {
    if (prospect.sources.includes('dscc')) {
      return { qualified: true, reason: 'dscc_duty_solicitor' };
    }
    return { qualified: false, reason: 'solicitor_not_on_dscc' };
  }

  if (hasVerifiedCrimeSource(prospect.sources)) {
    return { qualified: true, reason: 'verified_crime_source' };
  }

  if (prospect.sources.includes('archive')) {
    if (
      registry &&
      isOnCrimeRegistry(prospect.firmName, registry, prospect.regulatoryNumber)
    ) {
      return { qualified: true, reason: 'archive_corroborated_on_crime_registry' };
    }
    return { qualified: false, reason: 'archive_only_not_on_laa_or_dscc' };
  }

  return { qualified: false, reason: 'no_verified_crime_source' };
}

/** Apply outreach qualification when deciding ready_to_send vs discovered. */
export function resolveStatusWithQualification(
  prospect: OutreachQualificationProspect & Pick<FirmProspect, 'email'>,
  preferred: FirmProspectStatus,
  registry?: CrimeRegistry,
): FirmProspectStatus {
  if (
    (prospect.status === 'excluded' || prospect.excludedReason) &&
    !prospect.crimeWebsiteVerified
  ) {
    return 'excluded';
  }
  if (!prospect.email) return preferred === 'ready_to_send' ? 'discovered' : preferred;
  if (preferred !== 'ready_to_send') return preferred;

  const q = qualifyProspectForOutreach(prospect, registry);
  if (q.qualified) return 'ready_to_send';
  return 'discovered';
}

export function unqualifiedReason(prospect: OutreachQualificationProspect): string {
  return qualifyProspectForOutreach(prospect).reason;
}
