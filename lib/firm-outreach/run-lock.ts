import { claimKey } from '@/lib/kv-atomic';

/** Recover stale locks before the 300s Vercel cron ceiling. */
const RUN_LOCK_TTL_SECONDS = 270;

export type OutreachRunMode = 'send' | 'enrich' | 'maintain' | 'discovery';

export async function claimOutreachRunLock(mode: OutreachRunMode): Promise<boolean> {
  return claimKey(`firmoutreach:lock:${mode}`, RUN_LOCK_TTL_SECONDS);
}

/** Prevent duplicate concurrent sends for the same prospect. */
export async function claimProspectSend(prospectId: string): Promise<boolean> {
  return claimKey(`firmoutreach:send:claim:${prospectId}`, 3600);
}
