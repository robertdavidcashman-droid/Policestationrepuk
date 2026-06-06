import type { CustodyNumberFinding, DiscoveryVerificationStatus } from './types';

export function resolveApprovalVerificationStatus(
  finding: Pick<CustodyNumberFinding, 'confidenceLevel'>,
  markVerified?: boolean,
): DiscoveryVerificationStatus {
  if (markVerified === true) return 'verified';
  if (markVerified === false) return 'unverified';
  return finding.confidenceLevel === 'high' ? 'verified' : 'unverified';
}
