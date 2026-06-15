import { dailySendCap, outreachSendEnabled } from '../constants';
import { isActiveCampaignProspect } from '../campaign-scope';
import { sortProspectsForSend } from '../enrichment/scorer';
import { validateEmailForSend } from '../enrichment/validator';
import {
  qualifyProspectForOutreach,
  resolveStatusWithQualification,
} from '../qualification';
import {
  addSuppression,
  createSendRecord,
  excludeProspectDuplicateEmail,
  getDailySendCount,
  incrementDailySendCount,
  isDuplicateInitialSend,
  isSuppressed,
  listProspectsByStatus,
  listProspectsForFirmKey,
  saveProspect,
  saveSend,
} from '../storage';
import type { FirmProspect, OutreachRunStats } from '../types';
import { normalizeEmail } from '../normalize';
import { sendOutreachEmail } from './send';

const FOLLOWUP_DAY_1 = 7;
const FOLLOWUP_DAY_2 = 21;
const FIRM_SEND_COOLDOWN_DAYS = 90;

function daysSince(iso: string | undefined): number {
  if (!iso) return Infinity;
  return (Date.now() - Date.parse(iso)) / (1000 * 60 * 60 * 24);
}

async function firmRecentlyContacted(prospect: FirmProspect): Promise<boolean> {
  const siblings = await listProspectsForFirmKey(prospect.firmKey);
  for (const s of siblings) {
    if (s.id === prospect.id || !isActiveCampaignProspect(s)) continue;
    if (s.lastEmailAt && daysSince(s.lastEmailAt) < FIRM_SEND_COOLDOWN_DAYS) {
      return true;
    }
  }
  return false;
}

function dueForFollowUp(prospect: FirmProspect): boolean {
  if (prospect.waLinkClickedAt || prospect.joinedWhatsAppAt) return false;
  if (!prospect.lastEmailAt) return prospect.status === 'ready_to_send';

  const days = daysSince(prospect.lastEmailAt);
  if (prospect.sequenceStep === 0 && days >= FOLLOWUP_DAY_1) return true;
  if (prospect.sequenceStep === 1 && days >= FOLLOWUP_DAY_2 - FOLLOWUP_DAY_1) return true;
  return false;
}

function nextStep(prospect: FirmProspect): number | null {
  if (prospect.status === 'ready_to_send' && prospect.sequenceStep === 0 && !prospect.lastEmailAt) {
    return 0;
  }
  if (prospect.status === 'sent' && prospect.sequenceStep === 0 && dueForFollowUp(prospect)) return 1;
  if (prospect.status === 'sent' && prospect.sequenceStep === 1 && dueForFollowUp(prospect)) return 2;
  return null;
}

export async function runFirmOutreach(opts?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<OutreachRunStats> {
  const started = Date.now();
  const stats: OutreachRunStats = {
    queued: 0,
    sent: 0,
    skipped: 0,
    suppressed: 0,
    errors: 0,
    elapsedMs: 0,
  };

  if (!outreachSendEnabled()) {
    stats.elapsedMs = Date.now() - started;
    return stats;
  }

  const date = new Date().toISOString().slice(0, 10);
  const cap = opts?.limit ?? dailySendCap();
  const alreadySent = await getDailySendCount(date);
  const remaining = Math.max(0, cap - alreadySent);
  if (remaining === 0) {
    stats.elapsedMs = Date.now() - started;
    return stats;
  }

  const ready = (await listProspectsByStatus('ready_to_send', 2000)).filter(isActiveCampaignProspect);
  const sent = (await listProspectsByStatus('sent', 2000)).filter(isActiveCampaignProspect);
  const candidates = sortProspectsForSend([...ready, ...sent]);
  const emailsSentThisRun = new Set<string>();

  for (const prospect of candidates) {
    if (stats.sent >= remaining) break;

    const step = nextStep(prospect);
    if (step === null) {
      stats.skipped++;
      continue;
    }

    const email = prospect.email?.trim();
    if (!email) {
      stats.skipped++;
      continue;
    }

    const normalizedEmail = normalizeEmail(email);

    const qualification = qualifyProspectForOutreach(prospect);
    if (!qualification.qualified) {
      stats.skipped++;
      if (prospect.status === 'ready_to_send') {
        prospect.status = resolveStatusWithQualification(prospect, 'ready_to_send');
        prospect.updatedAt = new Date().toISOString();
        await saveProspect(prospect);
      }
      continue;
    }

    if (await isSuppressed(email)) {
      stats.suppressed++;
      prospect.status = 'unsubscribed';
      await saveProspect(prospect);
      continue;
    }

    if (
      step === 0 &&
      (emailsSentThisRun.has(normalizedEmail) ||
        (await isDuplicateInitialSend(email, prospect.id)))
    ) {
      stats.skipped++;
      if (prospect.status === 'ready_to_send') {
        await excludeProspectDuplicateEmail(prospect);
      }
      continue;
    }

    if (prospect.prospectType === 'solicitor' && (await firmRecentlyContacted(prospect))) {
      stats.skipped++;
      continue;
    }

    const validation = await validateEmailForSend(email);
    if (!validation.ok) {
      stats.skipped++;
      if (prospect.status === 'ready_to_send') {
        prospect.status = validation.reason === 'no_mx' ? 'no_email' : 'discovered';
        prospect.updatedAt = new Date().toISOString();
        await saveProspect(prospect);
      }
      continue;
    }

    stats.queued++;
    const result = await sendOutreachEmail({
      prospect,
      step,
      dryRun: opts?.dryRun,
    });

    if (!result.ok) {
      stats.errors++;
      if (result.error?.includes('bounce')) {
        await addSuppression(email, 'bounce');
        prospect.status = 'bounced';
        await saveProspect(prospect);
      }
      continue;
    }

    const now = new Date().toISOString();
    prospect.sequenceStep = step;
    prospect.lastEmailAt = now;
    prospect.status = 'sent';
    prospect.updatedAt = now;
    await saveProspect(prospect);

    const send = createSendRecord({
      prospectId: prospect.id,
      firmName: prospect.firmName,
      prospectType: prospect.prospectType,
      email,
      campaignId: prospect.campaignId,
      sequenceStep: step,
      subject: result.subject,
    });
    send.status = 'sent';
    send.sentAt = now;
    send.resendMessageId = result.messageId;
    await saveSend(send);

    if (!opts?.dryRun && process.env.FIRM_OUTREACH_DRY_RUN !== 'true') {
      await incrementDailySendCount(date);
    }
    emailsSentThisRun.add(normalizedEmail);
    stats.sent++;
  }

  stats.elapsedMs = Date.now() - started;
  return stats;
}
