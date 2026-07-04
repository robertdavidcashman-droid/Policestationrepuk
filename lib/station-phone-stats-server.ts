import { getAllStations } from '@/lib/data';
import { isCustodyStation } from '@/lib/custody-station';
import { computeStationPhoneStats, type StationPhoneStats } from '@/lib/station-numbers-campaign';
import { getCustodyPublicDisplay } from '@/lib/station-contacts/publish';
import type { PoliceStation } from '@/lib/types';

export interface StationPhonePublicStats extends StationPhoneStats {
  verifiedCustodyCount: number;
  custodyStationCount: number;
}

export function buildStationPhonePublicStats(stations: PoliceStation[]): StationPhonePublicStats {
  const base = computeStationPhoneStats(stations);
  const custodyStations = stations.filter((s) => isCustodyStation(s));
  const verifiedCustodyCount = custodyStations.filter(
    (s) => getCustodyPublicDisplay(s).published,
  ).length;

  return {
    ...base,
    custodyStationCount: custodyStations.length,
    verifiedCustodyCount,
  };
}

export async function getStationPhonePublicStats(): Promise<StationPhonePublicStats> {
  const stations = await getAllStations();
  return buildStationPhonePublicStats(stations);
}
