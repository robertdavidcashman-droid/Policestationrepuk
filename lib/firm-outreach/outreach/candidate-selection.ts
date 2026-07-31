import {
  FIRM_SEND_COOLDOWN_DAYS,
  daysSince,
  nextOutreachStep,
  sequenceStepOf,
} from '@robertcashman/firm-outreach-core';
import { computeProspectPriority } from '../enrichment/scorer';
import { listProspectsByRecordStatus, listProspectsForFirmKey } from '../storage';
import { isCampaignProspect } from '../campaign-scope';
import type { FirmProspect } from '../types';

export { nextOutreachStep, sequenceStepOf };

const DEFAULT_READY_SCAN = 500;
const DEFAULT_SENT_SCAN = 500;

export async function firmRecentlyContacted(
  prospect: FirmProspect,
  campaignId: string,
): Promise<boolean> {
  const siblings = await listProspectsForFirmKey(prospect.firmKey);
  for (const s of siblings) {
    if (s.id === prospect.id || !isCampaignProspect(s, campaignId)) continue;
    if (s.lastEmailAt && daysSince(s.lastEmailAt) < FIRM_SEND_COOLDOWN_DAYS) {
      return true;
    }
  }
  return false;
}

function compareCandidates(
  a: { prospect: FirmProspect; step: number },
  b: { prospect: FirmProspect; step: number },
): number {
  // Initial sends before follow-ups.
  if (a.step !== b.step) return a.step - b.step;
  // Firms before solicitors (solicitors often hit firm_cooldown).
  if (a.prospect.prospectType !== b.prospect.prospectType) {
    return a.prospect.prospectType === 'firm' ? -1 : 1;
  }
  return computeProspectPriority(b.prospect) - computeProspectPriority(a.prospect);
}

/**
 * Build the send candidate pool:
 * - ready_to_send rows that have a valid next step (initial)
 * - sent rows that are actually due for follow-up
 *
 * Critical: do NOT pollute the pool with not-due `sent` rows — that was causing
 * production runs to spend the whole budget on `no_step` skips and send nothing.
 */
export async function selectOutreachCandidates(opts: {
  campaignId: string;
  readyLimit?: number;
  sentLimit?: number;
  nowMs?: number;
  /** When true (default), drop solicitors whose firm was emailed inside the cooldown window. */
  excludeFirmCooldown?: boolean;
}): Promise<{
  candidates: Array<{ prospect: FirmProspect; step: number }>;
  readyScanned: number;
  sentScanned: number;
  readyEligible: number;
  followUpEligible: number;
  firmCooldownSkipped: number;
}> {
  const readyLimit = opts.readyLimit ?? DEFAULT_READY_SCAN;
  const sentLimit = opts.sentLimit ?? DEFAULT_SENT_SCAN;
  const nowMs = opts.nowMs ?? Date.now();
  const excludeFirmCooldown = opts.excludeFirmCooldown !== false;
  const campaignOpts = { campaignId: opts.campaignId };

  const ready = await listProspectsByRecordStatus('ready_to_send', readyLimit, campaignOpts);
  const sent = await listProspectsByRecordStatus('sent', sentLimit, campaignOpts);

  const readyEligible: Array<{ prospect: FirmProspect; step: number }> = [];
  for (const prospect of ready) {
    const step = nextOutreachStep(prospect, nowMs);
    if (step === null) continue;
    readyEligible.push({ prospect, step });
  }

  const followUpEligible: Array<{ prospect: FirmProspect; step: number }> = [];
  for (const prospect of sent) {
    const step = nextOutreachStep(prospect, nowMs);
    if (step === null) continue;
    followUpEligible.push({ prospect, step });
  }

  const ranked = [...readyEligible, ...followUpEligible].sort(compareCandidates);

  // Cache per firmKey so sibling cooldown lookups are O(firms) not O(prospects).
  const cooledFirmKeys = new Map<string, boolean>();
  let firmCooldownSkipped = 0;
  const candidates: Array<{ prospect: FirmProspect; step: number }> = [];

  for (const row of ranked) {
    if (
      excludeFirmCooldown &&
      row.prospect.prospectType === 'solicitor'
    ) {
      const key = row.prospect.firmKey;
      let cooled = cooledFirmKeys.get(key);
      if (cooled === undefined) {
        cooled = await firmRecentlyContacted(row.prospect, opts.campaignId);
        cooledFirmKeys.set(key, cooled);
      }
      if (cooled) {
        firmCooldownSkipped++;
        continue;
      }
    }
    candidates.push(row);
  }

  return {
    candidates,
    readyScanned: ready.length,
    sentScanned: sent.length,
    readyEligible: readyEligible.length,
    followUpEligible: followUpEligible.length,
    firmCooldownSkipped,
  };
}
