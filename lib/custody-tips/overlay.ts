import type { PoliceStation } from '@/lib/types';
import { isDialablePhone } from '@/lib/station-verification';
import { loadAllCustodyConsensus } from './storage';

/**
 * Merge rep-contributed custody numbers onto stations at request time.
 *
 * Precedence (highest first): admin station override (applied earlier) →
 * existing dialable number on file → rep consensus number. We therefore only
 * fill `custodyPhone` from a tip when the station has no dialable number yet
 * (so a lone unverified tip never silently replaces a known number — it is
 * shown with a caveat instead, via `custodyContribution.status`).
 */
export async function applyCustodyConsensus(
  stations: PoliceStation[],
): Promise<PoliceStation[]> {
  const map = await loadAllCustodyConsensus();
  if (map.size === 0) return stations;
  return stations.map((s) => {
    const c = map.get(s.id);
    if (!c) return s;
    const hasNumber = isDialablePhone(s.custodyPhone);
    return {
      ...s,
      custodyPhone: hasNumber ? s.custodyPhone : c.number,
      verificationMeta: {
        ...(s.verificationMeta ?? {}),
        custodyContribution: {
          status: c.status,
          confirmedBy: c.confirmedBy,
          dateVerified: c.dateVerified,
          source: 'rep_crowdsource',
        },
      },
    };
  });
}
