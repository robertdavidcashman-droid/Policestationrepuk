import type { PoliceStation } from '@/lib/types';
import { stationPhoneNumbers } from '@/lib/station-search';
import { deriveStationCounty } from '@/lib/force-county';
import { forceMatchesCounty } from '@/lib/police-force-to-counties';

export type AreaType = 'force' | 'county';

export interface AreaSelection {
  type: 'all' | AreaType;
  value: string;
}

export const ALL_AREAS: AreaSelection = { type: 'all', value: '' };

export interface AreaIndexEntry {
  label: string;
  count: number;
}

/** Grouping key for a station, matching the directory's force/county grouping. */
export function areaKey(station: PoliceStation, type: AreaType): string {
  if (type === 'county') {
    return (station.county && station.county.trim()) || deriveStationCounty(station);
  }
  const force =
    (station.forceName && station.forceName.trim()) ||
    (station.forceCode && station.forceCode.trim());
  return force || 'Force not listed';
}

/** Sorted list of areas (force or county) with station counts. */
export function buildAreaIndex(
  stations: PoliceStation[],
  type: AreaType,
): AreaIndexEntry[] {
  const counts = new Map<string, number>();
  for (const s of stations) {
    const key = areaKey(s, type);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label, 'en-GB'));
}

/** True when a station belongs to a county (curated force map + own county). */
export function stationInCounty(station: PoliceStation, county: string): boolean {
  const c = county.toLowerCase();
  if (station.county && station.county.toLowerCase() === c) return true;
  if (station.forceName && forceMatchesCounty(station.forceName, county)) return true;
  return false;
}

/** Filter stations to a selected area. 'all' returns the input unchanged. */
export function filterByArea(
  stations: PoliceStation[],
  area: AreaSelection,
): PoliceStation[] {
  if (area.type === 'all' || !area.value) return stations;
  if (area.type === 'county') {
    return stations.filter((s) => stationInCounty(s, area.value));
  }
  return stations.filter((s) => areaKey(s, 'force') === area.value);
}

/** Whether a station has a verified direct line shown in the directory. */
export function hasDirectNumber(station: PoliceStation): boolean {
  return stationPhoneNumbers(station).some((entry) => entry.className === 'station');
}
