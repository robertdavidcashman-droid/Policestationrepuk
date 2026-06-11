import { computeProspectPriority } from '../enrichment/scorer';
import { resolveStatusWithQualification } from '../qualification';
import {
  createSendRecord,
  getProspect,
  getSuppressionsByEmails,
  isSuppressed,
  saveProspect,
  saveSend,
} from '../storage';
import type {
  FirmProspect,
  FirmProspectStatus,
  OutreachExcludedRow,
  OutreachQueueRow,
} from '../types';
import { sendOutreachEmail } from './send';

export type RestoreExcludedOptions = {
  targetStatus?: 'discovered' | 'ready_to_send';
  addManualSource?: boolean;
  crimeWebsiteVerified?: boolean;
};

export type ManualSendOptions = {
  dryRun?: boolean;
  step?: number;
};

export type AdminActionResult<T> =
  | { ok: true; prospect: FirmProspect; data?: T }
  | { ok: false; error: string };

/** Whether an admin manual send is allowed (suppression respected; qualification bypassed). */
export function canManualSendProspect(
  prospect: FirmProspect,
  suppressed: boolean,
): { ok: boolean; reason?: string } {
  const email = prospect.email?.trim();
  if (!email) return { ok: false, reason: 'no_email' };
  if (suppressed) return { ok: false, reason: 'suppressed' };
  if (prospect.status === 'unsubscribed' || prospect.status === 'joined_whatsapp') {
    return { ok: false, reason: prospect.status };
  }
  return { ok: true };
}

export async function restoreExcludedProspect(
  prospectId: string,
  opts?: RestoreExcludedOptions,
): Promise<AdminActionResult<undefined>> {
  const prospect = await getProspect(prospectId);
  if (!prospect) return { ok: false, error: 'not_found' };
  if (prospect.status !== 'excluded') {
    return { ok: false, error: 'not_excluded' };
  }

  const prevStatus = prospect.status;
  prospect.excludedReason = undefined;

  if (opts?.addManualSource !== false && !prospect.sources.includes('manual')) {
    prospect.sources = [...prospect.sources, 'manual'];
  }
  if (opts?.crimeWebsiteVerified) {
    prospect.crimeWebsiteVerified = true;
  }

  const preferred: FirmProspectStatus =
    opts?.targetStatus ?? (prospect.email?.trim() ? 'ready_to_send' : 'discovered');

  prospect.status = resolveStatusWithQualification(
    { ...prospect, status: 'discovered' },
    preferred,
  );
  prospect.updatedAt = new Date().toISOString();
  await saveProspect(prospect, prevStatus);
  return { ok: true, prospect };
}

export async function manualSendProspect(
  prospectId: string,
  opts?: ManualSendOptions,
): Promise<AdminActionResult<{ subject: string; messageId?: string; dryRun: boolean }>> {
  const prospect = await getProspect(prospectId);
  if (!prospect) return { ok: false, error: 'not_found' };

  const email = prospect.email?.trim();
  if (!email) return { ok: false, error: 'no_email' };

  const suppressed = await isSuppressed(email);
  const eligibility = canManualSendProspect(prospect, suppressed);
  if (!eligibility.ok) return { ok: false, error: eligibility.reason ?? 'not_eligible' };

  const step = opts?.step ?? (prospect.sequenceStep === 0 && !prospect.lastEmailAt ? 0 : prospect.sequenceStep);
  const dryRun = opts?.dryRun ?? false;

  const result = await sendOutreachEmail({ prospect, step, dryRun });
  if (!result.ok) return { ok: false, error: result.error ?? 'send_failed' };

  if (dryRun) {
    return {
      ok: true,
      prospect,
      data: { subject: result.subject, messageId: result.messageId, dryRun: true },
    };
  }

  const prevStatus = prospect.status;
  const now = new Date().toISOString();
  prospect.sequenceStep = step;
  prospect.lastEmailAt = now;
  prospect.status = 'sent';
  prospect.updatedAt = now;
  await saveProspect(prospect, prevStatus);

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

  return {
    ok: true,
    prospect,
    data: { subject: result.subject, messageId: result.messageId, dryRun: false },
  };
}

export async function excludeProspect(
  prospectId: string,
  reason?: string,
): Promise<AdminActionResult<undefined>> {
  const prospect = await getProspect(prospectId);
  if (!prospect) return { ok: false, error: 'not_found' };
  if (prospect.status === 'excluded') {
    return { ok: false, error: 'already_excluded' };
  }

  const prevStatus = prospect.status;
  prospect.status = 'excluded';
  prospect.excludedReason = reason?.trim() || 'manual_admin_exclude';
  prospect.updatedAt = new Date().toISOString();
  await saveProspect(prospect, prevStatus);
  return { ok: true, prospect };
}

/** Map ready-to-send prospect rows with batched suppression lookup for the admin report. */
export async function queueRowsForProspects(
  prospects: FirmProspect[],
): Promise<OutreachQueueRow[]> {
  const emails = prospects.map((p) => p.email?.trim()).filter(Boolean) as string[];
  const suppressionMap = await getSuppressionsByEmails(emails);

  return prospects.map((p) => {
    const email = p.email?.trim();
    const suppression = email ? suppressionMap.get(email.toLowerCase()) : undefined;
    return {
      prospectId: p.id,
      firmName: p.firmName,
      prospectType: p.prospectType,
      contactName: p.contactName,
      county: p.county,
      email: p.email,
      sources: p.sources,
      priorityScore: computeProspectPriority(p),
      crimeWebsiteVerified: p.crimeWebsiteVerified,
      updatedAt: p.updatedAt,
      suppressed: Boolean(suppression),
      suppressionReason: suppression?.reason,
    };
  });
}

/** Map excluded prospect rows with batched suppression lookup for the admin report. */
export async function excludedRowsForProspects(
  prospects: FirmProspect[],
): Promise<OutreachExcludedRow[]> {
  const emails = prospects.map((p) => p.email?.trim()).filter(Boolean) as string[];
  const suppressionMap = await getSuppressionsByEmails(emails);

  return prospects.map((p) => {
    const email = p.email?.trim();
    const suppression = email ? suppressionMap.get(email.toLowerCase()) : undefined;
    return {
      prospectId: p.id,
      firmName: p.firmName,
      prospectType: p.prospectType,
      contactName: p.contactName,
      county: p.county,
      email: p.email,
      excludedReason: p.excludedReason,
      sources: p.sources,
      crimeWebsiteVerified: p.crimeWebsiteVerified,
      updatedAt: p.updatedAt,
      suppressed: Boolean(suppression),
      suppressionReason: suppression?.reason,
    };
  });
}
