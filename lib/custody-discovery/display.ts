import type { PoliceStation } from '@/lib/types';
import { isCustodyStation } from '@/lib/custody-station';
import { isVerifiedStationPhoneField } from '@/lib/station-phone-trust';
import { DEFAULT_NON_EMERGENCY } from '@/lib/official-force-contacts';

export type CustodyDisplayState =
  | 'verified'
  | 'found_unverified'
  | 'practice_reported'
  | 'stale'
  | 'rejected'
  | 'fallback_101';

export interface CustodyPhoneDisplay {
  state: CustodyDisplayState;
  number?: string;
  message?: string;
}

export function custodyFallbackMessage(station: PoliceStation): string {
  const label = station.name || 'the custody suite';
  return `Direct custody number not currently verified. Use 101 and ask for ${label}.`;
}

/**
 * Public custody phone display — only admin-approved discovery numbers or
 * other verified custody lines are shown as dialable custody numbers.
 */
export function getCustodyPhoneDisplay(station: PoliceStation): CustodyPhoneDisplay {
  const discovery = station.verificationMeta?.custodyDiscovery;
  if (discovery?.status === 'unverified' && station.custodyPhone) {
    return { state: 'found_unverified', number: station.custodyPhone };
  }
  if (discovery?.status === 'verified' && station.custodyPhone) {
    return { state: 'verified', number: station.custodyPhone };
  }

  if (
    station.custodyPhone &&
    isVerifiedStationPhoneField(station, 'custodyPhone', station.custodyPhone)
  ) {
    return { state: 'verified', number: station.custodyPhone };
  }

  if (station.verificationMeta?.custodyContribution) {
    const c = station.verificationMeta.custodyContribution;
    if (c.status === 'verified' && station.custodyPhone) {
      return { state: 'practice_reported', number: station.custodyPhone };
    }
    if (c.status === 'unverified') {
      return { state: 'found_unverified', message: custodyFallbackMessage(station) };
    }
  }

  if (isCustodyStation(station)) {
    return {
      state: 'fallback_101',
      message: custodyFallbackMessage(station),
      number: DEFAULT_NON_EMERGENCY,
    };
  }

  return { state: 'fallback_101', number: DEFAULT_NON_EMERGENCY };
}
