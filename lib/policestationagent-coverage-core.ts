import { deriveStationCounty } from '@/lib/force-county';
import type { PoliceStation } from '@/lib/types';

/** Police Station Agent base — West Kingsdown, Kent. */
export const PSA_COVERAGE_HUB = {
  name: 'West Kingsdown',
  lat: 51.2967,
  lng: 0.238,
} as const;

/** Non-Kent stations: max estimated drive time from West Kingsdown. Kent always qualifies. */
export const PSA_MAX_DRIVE_MINUTES = 45;
export const PSA_ROAD_FACTOR = 1.35;
export const PSA_AVG_SPEED_KPH = 55;

export type PsaCoverageReason = 'kent' | 'drive_time';

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimatedDriveMinutesFromHub(lat: number, lng: number): number {
  const km = haversineKm(PSA_COVERAGE_HUB.lat, PSA_COVERAGE_HUB.lng, lat, lng);
  const roadKm = km * PSA_ROAD_FACTOR;
  return (roadKm / PSA_AVG_SPEED_KPH) * 60;
}

export function isWithinDriveTimeFromHub(lat: number, lng: number): boolean {
  return estimatedDriveMinutesFromHub(lat, lng) <= PSA_MAX_DRIVE_MINUTES;
}

export function isKentBasedStation(station: PoliceStation): boolean {
  const force = (station.forceName || '').toLowerCase().trim();
  if (force === 'kent police') return true;
  return deriveStationCounty(station).toLowerCase() === 'kent';
}

export function coverageReasonForStation(station: PoliceStation): PsaCoverageReason | null {
  if (isKentBasedStation(station)) return 'kent';
  const lat = station.latitude;
  const lng = station.longitude;
  if (lat != null && lng != null && isWithinDriveTimeFromHub(lat, lng)) {
    return 'drive_time';
  }
  return null;
}

export function isStationInCoverage(station: PoliceStation): boolean {
  return coverageReasonForStation(station) !== null;
}

export function countyNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
