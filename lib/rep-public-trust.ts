import type { Representative } from '@/lib/types';
import { isPubliclyVisible, type RepVerificationStatus } from '@/lib/rep-status';

/** Whether this rep passed the strict admin verification publication gate (not legacy fallback). */
export function isStrictDirectoryListing(rep: Representative): boolean {
  const status = (rep.verificationStatus ?? null) as RepVerificationStatus | null;
  return isPubliclyVisible({
    status,
    adminApproved: rep.adminApproved ?? null,
    isPublic: rep.isPublic ?? null,
    lastVerifiedDate: rep.lastVerifiedDate ?? null,
  });
}
