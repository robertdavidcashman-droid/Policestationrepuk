import {
  bumpSkipReason,
  createEmptySkipReasons,
  nextOutreachStep,
} from '@robertcashman/firm-outreach-core';
import { activeOutreachCampaignId } from './campaign-scope';
import { dailySendCap } from './constants';
import { isPlausibleOutreachEmail, validateEmailForSend } from './enrichment/validator';
import { qualifyProspectForOutreach } from './qualification';
import {
  firmRecentlyContacted,
  selectOutreachCandidates,
} from './outreach/candidate-selection';
import {
  getDailySendCount,
  getGlobalResendQuotaRemaining,
  isDuplicateInitialSend,
  isSuppressed,
} from './storage';
import { normalizeEmail } from './normalize';

export interface DryRunPreviewRow {
  prospectId: string;
  firmName: string;
  email?: string;
  status: string;
  step: number | null;
  wouldSend: boolean;
  skipReason?: string;
}

export interface DryRunPreviewResult {
  campaignId: string;
  date: string;
  dailyCap: number;
  sentToday: number;
  remaining: number;
  resendQuotaRemaining: number;
  /** min(would-send eligible, remaining daily, resend quota) */
  safeSendLimitNow: number;
  wouldSendCount: number;
  preview: DryRunPreviewRow[];
  skipReasons: Partial<Record<string, number>>;
  selection?: {
    readyScanned: number;
    sentScanned: number;
    readyEligible: number;
    followUpEligible: number;
    firmCooldownSkipped: number;
    sendableCandidates: number;
  };
}

export async function buildOutreachDryRunPreview(opts?: {
  campaignId?: string;
  limit?: number;
  maxRows?: number;
}): Promise<DryRunPreviewResult> {
  return previewFirmOutreachDryRun(opts);
}

export async function previewFirmOutreachDryRun(opts?: {
  campaignId?: string;
  limit?: number;
  maxRows?: number;
}): Promise<DryRunPreviewResult> {
  const campaignId = opts?.campaignId ?? activeOutreachCampaignId();
  const date = new Date().toISOString().slice(0, 10);
  const dailyCap = dailySendCap();
  const sentToday = await getDailySendCount(date, campaignId);
  const remaining = Math.max(0, Math.min(opts?.limit ?? dailyCap, dailyCap - sentToday));
  const resendQuotaRemaining = await getGlobalResendQuotaRemaining(date);
  const maxRows = opts?.maxRows ?? 50;
  const skipReasons = createEmptySkipReasons();
  const preview: DryRunPreviewRow[] = [];
  const emailsSeen = new Set<string>();
  let wouldSend = 0;

  const selection = await selectOutreachCandidates({
    campaignId,
    readyLimit: 500,
    sentLimit: 500,
  });

  for (const { prospect, step } of selection.candidates) {
    if (preview.length >= maxRows && wouldSend >= remaining) break;

    const email = prospect.email?.trim();
    const row: DryRunPreviewRow = {
      prospectId: prospect.id,
      firmName: prospect.firmName,
      email,
      status: prospect.status,
      step,
      wouldSend: false,
    };

    if (wouldSend >= remaining) {
      row.skipReason = 'daily_cap';
      bumpSkipReason(skipReasons, 'daily_cap');
      preview.push(row);
      continue;
    }

    if (!email) {
      row.skipReason = 'no_email';
      bumpSkipReason(skipReasons, 'no_email');
      preview.push(row);
      continue;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!qualifyProspectForOutreach(prospect).qualified) {
      row.skipReason = 'not_qualified';
      bumpSkipReason(skipReasons, 'not_qualified');
      preview.push(row);
      continue;
    }

    if (await isSuppressed(email)) {
      row.skipReason = 'suppressed';
      bumpSkipReason(skipReasons, 'suppressed');
      preview.push(row);
      continue;
    }

    if (
      step === 0 &&
      (emailsSeen.has(normalizedEmail) ||
        (await isDuplicateInitialSend(email, prospect.id, campaignId)))
    ) {
      row.skipReason = 'duplicate';
      bumpSkipReason(skipReasons, 'duplicate');
      preview.push(row);
      continue;
    }

    if (
      prospect.prospectType === 'solicitor' &&
      (await firmRecentlyContacted(prospect, campaignId))
    ) {
      row.skipReason = 'firm_cooldown';
      bumpSkipReason(skipReasons, 'firm_cooldown');
      preview.push(row);
      continue;
    }

    if (!isPlausibleOutreachEmail(email)) {
      const validation = await validateEmailForSend(email);
      if (!validation.ok) {
        row.skipReason = 'mx_invalid';
        bumpSkipReason(skipReasons, 'mx_invalid');
        preview.push(row);
        continue;
      }
    }

    // Confirm step still resolves (defensive).
    if (nextOutreachStep(prospect) !== step) {
      row.skipReason = 'no_step';
      bumpSkipReason(skipReasons, 'no_step');
      preview.push(row);
      continue;
    }

    row.wouldSend = true;
    wouldSend++;
    emailsSeen.add(normalizedEmail);
    preview.push(row);
  }

  const safeSendLimitNow = Math.max(
    0,
    Math.min(wouldSend, remaining, resendQuotaRemaining),
  );

  return {
    campaignId,
    date,
    dailyCap,
    sentToday,
    remaining,
    resendQuotaRemaining,
    safeSendLimitNow,
    wouldSendCount: wouldSend,
    preview,
    skipReasons,
    selection: {
      readyScanned: selection.readyScanned,
      sentScanned: selection.sentScanned,
      readyEligible: selection.readyEligible,
      followUpEligible: selection.followUpEligible,
      firmCooldownSkipped: selection.firmCooldownSkipped,
      sendableCandidates: selection.candidates.length,
    },
  };
}
