import { activeOutreachCampaignId } from '../campaign-scope';
import {
  getProspect,
  listProspectIdsByRecordStatus,
  saveProspect,
} from '../storage';
import {
  daysSinceIso,
  MAX_ENRICH_ATTEMPTS,
  NO_EMAIL_RETRY_DAYS,
} from './enrich-candidates';

export interface RecoverEnrichPoolResult {
  retiredExhaustedDiscovered: number;
  requeuedStaleNoEmail: number;
  campaignId: string;
}

/**
 * Keep the enrich pool healthy:
 * 1. discovered + enrichAttempts >= MAX → no_email (stop clogging the pool)
 * 2. no_email due for retry (including at MAX attempts) → reset attempts and
 *    return to discovered so crawl/paid enrich can try again
 */
export async function recoverEnrichPool(opts?: {
  campaignId?: string;
  dryRun?: boolean;
  nowMs?: number;
  maxRetire?: number;
  maxRequeue?: number;
}): Promise<RecoverEnrichPoolResult> {
  const campaignId = opts?.campaignId ?? activeOutreachCampaignId();
  const now = opts?.nowMs ?? Date.now();
  const maxRetire = opts?.maxRetire ?? 200;
  const maxRequeue = opts?.maxRequeue ?? 100;
  const campaignOpts = { campaignId };

  let retiredExhaustedDiscovered = 0;
  let requeuedStaleNoEmail = 0;

  const discovered = await listProspectIdsByRecordStatus('discovered', campaignOpts);
  for (const id of discovered) {
    if (retiredExhaustedDiscovered >= maxRetire) break;
    const p = await getProspect(id);
    if (!p || p.enrichAttempts < MAX_ENRICH_ATTEMPTS) continue;
    if (!opts?.dryRun) {
      p.status = 'no_email';
      p.updatedAt = new Date(now).toISOString();
      await saveProspect(p, 'discovered');
    }
    retiredExhaustedDiscovered++;
  }

  const noEmail = await listProspectIdsByRecordStatus('no_email', campaignOpts);
  for (const id of noEmail) {
    if (requeuedStaleNoEmail >= maxRequeue) break;
    const p = await getProspect(id);
    if (!p) continue;
    if (daysSinceIso(p.lastEnrichAttemptAt, now) < NO_EMAIL_RETRY_DAYS) continue;
    if (!opts?.dryRun) {
      p.status = 'discovered';
      p.enrichAttempts = 0;
      p.updatedAt = new Date(now).toISOString();
      await saveProspect(p, 'no_email');
    }
    requeuedStaleNoEmail++;
  }

  return { retiredExhaustedDiscovered, requeuedStaleNoEmail, campaignId };
}
