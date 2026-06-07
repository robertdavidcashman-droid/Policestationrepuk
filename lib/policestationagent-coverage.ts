import coverageData from '@/data/policestationagent-coverage.json';

export {
  PSA_AVG_SPEED_KPH,
  PSA_COVERAGE_HUB,
  PSA_MAX_DRIVE_MINUTES,
  PSA_ROAD_FACTOR,
  countyNameToSlug,
  coverageReasonForStation,
  estimatedDriveMinutesFromHub,
  haversineKm,
  isKentBasedStation,
  isStationInCoverage,
  isWithinDriveTimeFromHub,
} from '@/lib/policestationagent-coverage-core';
export type { PsaCoverageReason } from '@/lib/policestationagent-coverage-core';

export interface PsaCoverageIndex {
  hub: { name: string; lat: number; lng: number };
  maxDriveMinutes: number;
  stationSlugs: string[];
  stationIds: string[];
  countySlugsWithCoverage: Record<string, 'full' | 'partial'>;
  generatedAt: string;
}

const index = coverageData as PsaCoverageIndex;
const slugSet = new Set(index.stationSlugs);
const idSet = new Set(index.stationIds);

export function getPsaCoverageIndex(): PsaCoverageIndex {
  return index;
}

export function isStationSlugInCoverage(slug: string | null | undefined): boolean {
  if (!slug?.trim()) return false;
  return slugSet.has(slug.trim());
}

export function isStationIdInCoverage(id: string | null | undefined): boolean {
  if (!id?.trim()) return false;
  return idSet.has(id.trim());
}

export function countySlugHasPsaCoverage(countySlug: string | null | undefined): boolean {
  if (!countySlug?.trim()) return false;
  return countySlug.trim().toLowerCase() in index.countySlugsWithCoverage;
}

export function countySlugCoverageLevel(
  countySlug: string | null | undefined,
): 'full' | 'partial' | null {
  if (!countySlug?.trim()) return null;
  return index.countySlugsWithCoverage[countySlug.trim().toLowerCase()] ?? null;
}
