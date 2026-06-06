import type { PoliceStation } from '@/lib/types';
import { isCustodyStation } from '@/lib/custody-station';
import { forceDomainForName } from './force-domains';
import type { CustodySuite } from './types';

function isActiveStation(station: PoliceStation): boolean {
  const status = station.status?.toLowerCase().trim();
  return !status || status === 'active';
}

export function stationToCustodySuite(station: PoliceStation, now = new Date()): CustodySuite {
  const iso = now.toISOString();
  const dedicated = isCustodyStation(station);
  return {
    id: station.id,
    stationSlug: station.slug,
    forceName: station.forceName ?? 'Unknown force',
    forceDomain: forceDomainForName(station.forceName ?? ''),
    county: station.county ?? '',
    custodySuiteName: station.name,
    policeStationName: station.name,
    address: station.address ?? '',
    isDedicatedCustodySuite: dedicated,
    active: isActiveStation(station),
    createdAt: iso,
    updatedAt: iso,
  };
}

/**
 * Build discovery targets from the full police station directory (~900 rows).
 * Every station is searched for a direct custody desk number, not only
 * rows flagged as dedicated custody suites.
 */
export function buildCustodySuitesFromStations(stations: PoliceStation[]): CustodySuite[] {
  return stations.filter(isActiveStation).map((s) => stationToCustodySuite(s));
}
