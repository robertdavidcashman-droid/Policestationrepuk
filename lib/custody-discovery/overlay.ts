import type { PoliceStation } from '@/lib/types';
import { isDialablePhone } from '@/lib/station-phone-dialable';
import { getApprovedCache } from './storage';

/**
 * Merge admin-approved discovery numbers onto stations at request time.
 * Only numbers explicitly approved via /admin/custody-number-review are published.
 */
export async function applyApprovedDiscoveryNumbers(
  stations: PoliceStation[],
): Promise<PoliceStation[]> {
  const approved = await getApprovedCache();
  if (approved.size === 0) return stations;

  return stations.map((s) => {
    const record = approved.get(s.id);
    if (!record?.publicVisible) return s;

    const number = record.phoneNumber.trim();
    if (!isDialablePhone(number)) return s;

    const verificationStatus = record.verificationStatus ?? 'unverified';
    return {
      ...s,
      custodyPhone: number,
      verificationMeta: {
        ...(s.verificationMeta ?? {}),
        fields: {
          ...(s.verificationMeta?.fields ?? {}),
          custodyPhone: {
            status: verificationStatus,
            sourceUrl: record.sourceUrl || undefined,
            notes:
              verificationStatus === 'verified'
                ? `Admin-approved discovery (${record.approvedAt.slice(0, 10)})`
                : `Admin-approved discovery — unverified pending confirmation (${record.approvedAt.slice(0, 10)})`,
          },
        },
        custodyDiscovery: {
          status: verificationStatus,
          sourceFindingId: record.sourceFindingId,
          sourceUrl: record.sourceUrl,
          approvedAt: record.approvedAt,
          approvedBy: record.approvedBy,
          source: 'autonomous_discovery' as const,
        },
      },
    };
  });
}
