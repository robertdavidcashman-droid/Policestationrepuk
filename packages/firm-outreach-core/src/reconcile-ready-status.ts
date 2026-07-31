import { daysSince, dueForFollowUp, sequenceStepOf } from './email-jobs';
import { isPlausibleOutreachEmail } from './enrichment/validator';
import type { FirmProspect, FirmProspectStatus } from './types';

/** Whether an initial outreach email was already recorded on this prospect. */
export function prospectHasInitialSend(
  prospect: Pick<FirmProspect, 'lastEmailAt' | 'sequenceStep'>,
): boolean {
  // Any lastEmailAt on a ready row means the initial send already happened —
  // including legacy rows where sequenceStep is missing/undefined.
  return Boolean(prospect.lastEmailAt);
}

/**
 * ready_to_send + lastEmailAt is a stale index state: the initial send already happened
 * but status was not moved to sent. That blocks the morning cron from picking new firms.
 */
export function reconcileReadyProspectStatus(
  prospect: Pick<FirmProspect, 'status' | 'lastEmailAt' | 'sequenceStep' | 'email'>,
): FirmProspectStatus | null {
  if (prospect.status !== 'ready_to_send') return null;

  if (prospectHasInitialSend(prospect)) {
    return 'sent';
  }

  const email = prospect.email?.trim();
  if (email && !isPlausibleOutreachEmail(email)) {
    return 'discovered';
  }

  return null;
}

/** True when a sent prospect is due for follow-up step 1 (day 7). */
export function isDueForFollowUpStep1(
  prospect: Pick<
    FirmProspect,
    'sequenceStep' | 'lastEmailAt' | 'waLinkClickedAt' | 'joinedWhatsAppAt' | 'status'
  >,
): boolean {
  if (prospect.waLinkClickedAt || prospect.joinedWhatsAppAt) return false;
  if (sequenceStepOf(prospect) !== 0 || !prospect.lastEmailAt) return false;
  return dueForFollowUp(
    {
      status: prospect.status ?? 'sent',
      sequenceStep: sequenceStepOf(prospect),
      lastEmailAt: prospect.lastEmailAt,
      waLinkClickedAt: prospect.waLinkClickedAt,
      joinedWhatsAppAt: prospect.joinedWhatsAppAt,
    },
  );
}

export { daysSince, sequenceStepOf };
