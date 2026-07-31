import {
  isRetryableProviderError,
  normalizeEmail,
  retryDelayMs,
  validateOutreachEnv,
} from '@robertcashman/firm-outreach-core';
import { activeOutreachCampaignId } from '../campaign-scope';
import { dailySendCap, outreachSendEnabled } from '../constants';
import { isPlausibleOutreachEmail, validateEmailForSend } from '../enrichment/validator';
import {
  claimNextEmailJob,
  enqueueEmailJob,
  markJobAccepted,
  markJobProcessing,
  markJobRetryOrPermanent,
  markJobSuppressed,
  recoverAbandonedEmailJobs,
  requeueClaimedJob,
} from '../email-jobs/storage';
import { isOutreachSendAllowed } from '../pause-state';
import {
  qualifyProspectForOutreach,
  resolveStatusWithQualification,
} from '../qualification';
import { OUTREACH_CAMPAIGN_IDS } from '../site-config';
import {
  addSuppression,
  createSendRecord,
  excludeProspectDuplicateEmail,
  getDailySendCount,
  getGlobalResendQuotaRemaining,
  incrementResendSendCount,
  isDuplicateInitialSend,
  isSuppressed,
  releaseDailySendSlot,
  releaseHourlySendSlot,
  reserveDailySendSlot,
  reserveHourlySendSlot,
  saveOutreachRunLog,
  saveProspect,
  saveSend,
  utcHourBucket,
} from '../storage';
import type { FirmProspect, OutreachRunStats } from '../types';
import { assertOutreachSendReady } from './from-address';
import {
  firmRecentlyContacted,
  selectOutreachCandidates,
} from './candidate-selection';
import {
  buildOutreachRunLog,
  initExtendedRunStats,
  recordFailure,
  recordSkip,
} from './run-log';
import { sendOutreachEmail } from './send';
import { claimProspectSend } from '../run-lock';
import crypto from 'crypto';

const DEFAULT_MAX_ELAPSED_MS = 240_000;

/** Prospects in ready/sent were MX-checked at enrich/requalify; skip DNS on send ticks. */
function emailPrevalidatedForSend(prospect: FirmProspect): boolean {
  return prospect.status === 'ready_to_send' || prospect.status === 'sent';
}

function hourlySendCap(): number {
  const n = Number(process.env.FIRM_OUTREACH_HOURLY_CAP ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function newRunId(): string {
  return `forun_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
}

async function persistRunLog(opts: {
  campaignId: string;
  startedAt: string;
  dryRun: boolean;
  stats: OutreachRunStats;
  dailyCap: number;
  sentTodayBefore: number;
  resendQuotaRemaining: number;
}): Promise<void> {
  const dryRunEnv = process.env.FIRM_OUTREACH_DRY_RUN?.trim().toLowerCase();
  if (
    opts.dryRun ||
    (dryRunEnv !== undefined && ['1', 'true', 'yes', 'on'].includes(dryRunEnv))
  ) {
    return;
  }
  await saveOutreachRunLog(
    buildOutreachRunLog({
      campaignId: opts.campaignId,
      startedAt: opts.startedAt,
      dryRun: opts.dryRun,
      stats: opts.stats,
      dailyCap: opts.dailyCap,
      sentTodayBefore: opts.sentTodayBefore,
      resendQuotaRemaining: opts.resendQuotaRemaining,
    }),
  );
}

function structuredRunLog(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: Record<string, unknown>,
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    service: 'firm-outreach',
    event,
    ...fields,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}

export async function runFirmOutreach(opts?: {
  campaignId?: string;
  dryRun?: boolean;
  limit?: number;
  maxElapsedMs?: number;
}): Promise<OutreachRunStats> {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const runId = newRunId();
  const campaignId = opts?.campaignId ?? activeOutreachCampaignId();
  const stats = initExtendedRunStats({
    queued: 0,
    sent: 0,
    skipped: 0,
    suppressed: 0,
    errors: 0,
    elapsedMs: 0,
    jobsCreated: 0,
    jobsClaimed: 0,
    accepted: 0,
    retryScheduled: 0,
    permanentlyFailed: 0,
    abandonedRecovered: 0,
    runId,
  });

  const finish = async (resendQuotaRemaining: number, sentTodayBefore: number, cap: number) => {
    stats.elapsedMs = Date.now() - started;
    stats.resendQuotaRemaining = resendQuotaRemaining;
    structuredRunLog('info', 'outreach.run.finished', {
      runId,
      campaignId,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
      dryRun: Boolean(opts?.dryRun),
      candidatesEligible: stats.queued,
      jobsCreated: stats.jobsCreated,
      jobsClaimed: stats.jobsClaimed,
      accepted: stats.accepted,
      sent: stats.sent,
      failed: stats.failed,
      retryScheduled: stats.retryScheduled,
      permanentlyFailed: stats.permanentlyFailed,
      skipped: stats.skipped,
      suppressed: stats.suppressed,
      skipReasons: stats.skipReasons,
      elapsedMs: stats.elapsedMs,
      dailyCap: cap,
      sentTodayBefore,
      resendQuotaRemaining,
      partial: stats.partial ?? false,
    });
    await persistRunLog({
      campaignId,
      startedAt,
      dryRun: Boolean(opts?.dryRun),
      stats,
      dailyCap: cap,
      sentTodayBefore,
      resendQuotaRemaining,
    });
    if (stats.sent > 0 || stats.errors > 0) {
      const { refreshProspectStatusSnapshotCache } = await import('../storage');
      await refreshProspectStatusSnapshotCache();
    }
    return stats;
  };

  const envCheck = validateOutreachEnv({ forLiveSend: !opts?.dryRun });
  if (!envCheck.ok && !opts?.dryRun && envCheck.sendingEnabled && !envCheck.dryRun) {
    recordSkip(stats, 'send_disabled');
    stats.skippedReason = `env_invalid:${envCheck.errors.join(',')}`;
    structuredRunLog('error', 'outreach.run.env_invalid', {
      runId,
      campaignId,
      errors: envCheck.errors,
    });
    return finish(0, 0, dailySendCap());
  }

  if (!outreachSendEnabled() || !(await isOutreachSendAllowed())) {
    recordSkip(stats, 'send_disabled');
    return finish(0, 0, dailySendCap());
  }

  const readyCheck = await assertOutreachSendReady(campaignId);
  if (!readyCheck.ok) {
    recordSkip(stats, 'send_disabled');
    stats.skippedReason = readyCheck.reason;
    return finish(0, 0, dailySendCap());
  }

  const date = new Date().toISOString().slice(0, 10);
  const hourBucket = utcHourBucket();
  const dailyCap = dailySendCap();
  const hourCap = hourlySendCap();
  const batchLimit = opts?.limit ?? dailyCap;
  const alreadySent = await getDailySendCount(date, campaignId);
  const remainingDaily = Math.max(0, dailyCap - alreadySent);
  const remaining = Math.min(batchLimit, remainingDaily);
  const globalQuota = await getGlobalResendQuotaRemaining(date);
  const maxElapsedMs = opts?.maxElapsedMs ?? DEFAULT_MAX_ELAPSED_MS;
  const dryRunEnv = process.env.FIRM_OUTREACH_DRY_RUN?.trim().toLowerCase();
  const envDryRun =
    dryRunEnv !== undefined && ['1', 'true', 'yes', 'on'].includes(dryRunEnv);
  const dryRun = Boolean(opts?.dryRun || envDryRun);

  if (remaining === 0) {
    recordSkip(stats, 'daily_cap');
    return finish(globalQuota, alreadySent, dailyCap);
  }
  if (!dryRun && globalQuota <= 0) {
    recordSkip(stats, 'resend_quota');
    return finish(0, alreadySent, dailyCap);
  }

  // Recover abandoned claims before enqueue/process (live mode only).
  if (!dryRun) {
    stats.abandonedRecovered = await recoverAbandonedEmailJobs({ limit: 50 });
  }

  const selection = await selectOutreachCandidates({
    campaignId,
    readyLimit: 500,
    sentLimit: 500,
  });

  structuredRunLog('info', 'outreach.run.selection', {
    runId,
    campaignId,
    readyScanned: selection.readyScanned,
    sentScanned: selection.sentScanned,
    readyEligible: selection.readyEligible,
    followUpEligible: selection.followUpEligible,
    candidates: selection.candidates.length,
    remaining,
    dryRun,
  });

  const emailsSentThisRun = new Set<string>();
  let resendQuota = globalQuota;
  const correlationId = runId;

  // Dry-run: evaluate gates and simulate sends without writing jobs or calling provider for real.
  if (dryRun) {
    for (const { prospect, step } of selection.candidates) {
      if (stats.sent >= remaining) break;
      if (Date.now() - started >= maxElapsedMs) {
        stats.partial = true;
        break;
      }
      const email = prospect.email?.trim();
      if (!email) {
        recordSkip(stats, 'no_email');
        continue;
      }
      const normalizedEmail = normalizeEmail(email);
      if (!qualifyProspectForOutreach(prospect).qualified) {
        recordSkip(stats, 'not_qualified');
        continue;
      }
      if (await isSuppressed(email)) {
        stats.suppressed++;
        stats.attempted = (stats.attempted ?? 0) + 1;
        continue;
      }
      if (
        step === 0 &&
        (emailsSentThisRun.has(normalizedEmail) ||
          (await isDuplicateInitialSend(email, prospect.id, campaignId)))
      ) {
        recordSkip(stats, 'duplicate');
        continue;
      }
      if (
        prospect.prospectType === 'solicitor' &&
        (await firmRecentlyContacted(prospect, campaignId))
      ) {
        recordSkip(stats, 'firm_cooldown');
        continue;
      }
      if (!isPlausibleOutreachEmail(email)) {
        recordSkip(stats, 'mx_invalid');
        continue;
      }
      stats.queued++;
      stats.attempted = (stats.attempted ?? 0) + 1;
      const result = await sendOutreachEmail({ prospect, step, dryRun: true });
      if (result.ok) {
        emailsSentThisRun.add(normalizedEmail);
        stats.sent++;
        stats.accepted = (stats.accepted ?? 0) + 1;
      } else {
        recordFailure(stats, {
          email,
          firmName: prospect.firmName,
          prospectId: prospect.id,
          reason: result.error ?? 'dry_run_error',
          transient: false,
        });
      }
    }
    return finish(globalQuota, alreadySent, dailyCap);
  }

  // Phase 1: enqueue durable jobs for eligible prospects (idempotent).
  for (const { prospect, step } of selection.candidates) {
    if (Date.now() - started >= maxElapsedMs) {
      stats.partial = true;
      break;
    }
    if ((stats.jobsCreated ?? 0) >= remaining * 3) break;

    try {
      const email = prospect.email?.trim();
      if (!email) {
        recordSkip(stats, 'no_email');
        continue;
      }
      const normalizedEmail = normalizeEmail(email);

      const qualification = qualifyProspectForOutreach(prospect);
      if (!qualification.qualified) {
        recordSkip(stats, 'not_qualified');
        if (prospect.status === 'ready_to_send') {
          prospect.status = resolveStatusWithQualification(prospect, 'ready_to_send');
          prospect.updatedAt = new Date().toISOString();
          await saveProspect(prospect);
        }
        continue;
      }

      if (await isSuppressed(email)) {
        stats.suppressed++;
        stats.attempted = (stats.attempted ?? 0) + 1;
        prospect.status = 'unsubscribed';
        await saveProspect(prospect);
        continue;
      }

      if (
        step === 0 &&
        (emailsSentThisRun.has(normalizedEmail) ||
          (await isDuplicateInitialSend(email, prospect.id, campaignId)))
      ) {
        recordSkip(stats, 'duplicate');
        if (prospect.status === 'ready_to_send') {
          await excludeProspectDuplicateEmail(prospect);
        }
        continue;
      }

      if (
        prospect.prospectType === 'solicitor' &&
        (await firmRecentlyContacted(prospect, campaignId))
      ) {
        recordSkip(stats, 'firm_cooldown');
        continue;
      }

      if (emailPrevalidatedForSend(prospect)) {
        if (!isPlausibleOutreachEmail(email)) {
          recordSkip(stats, 'mx_invalid');
          continue;
        }
      } else {
        const validation = await validateEmailForSend(email);
        if (!validation.ok) {
          recordSkip(stats, 'mx_invalid');
          if (prospect.status === 'ready_to_send') {
            prospect.status = validation.reason === 'no_mx' ? 'no_email' : 'discovered';
            prospect.updatedAt = new Date().toISOString();
            await saveProspect(prospect);
          }
          continue;
        }
      }

      stats.queued++;
      const enqueued = await enqueueEmailJob({
        campaignId: prospect.campaignId,
        prospectId: prospect.id,
        firmName: prospect.firmName,
        prospectType: prospect.prospectType,
        email: normalizedEmail,
        sequenceStep: step,
        correlationId,
        runId,
        dryRun: false,
      });
      if (enqueued.created) {
        stats.jobsCreated = (stats.jobsCreated ?? 0) + 1;
      } else if (enqueued.duplicate) {
        if (
          enqueued.job.status === 'accepted' ||
          enqueued.job.status === 'delivered' ||
          enqueued.job.status === 'permanently_failed'
        ) {
          recordSkip(stats, 'idempotent_exists');
          if (step === 0 && prospect.status === 'ready_to_send') {
            await excludeProspectDuplicateEmail(prospect);
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      recordFailure(stats, {
        email: prospect.email ?? '',
        firmName: prospect.firmName,
        prospectId: prospect.id,
        reason: msg,
        transient: isRetryableProviderError(msg),
      });
    }
  }

  // Phase 2: claim and process durable jobs (persist-before-send).
  const owner = `${runId}:${campaignId}`;
  while (stats.sent < remaining) {
    if (Date.now() - started >= maxElapsedMs) {
      stats.partial = true;
      break;
    }
    if (resendQuota <= 0) {
      recordSkip(stats, 'resend_quota');
      break;
    }

    const job = await claimNextEmailJob({ owner, campaignId });
    if (!job) break;

    stats.jobsClaimed = (stats.jobsClaimed ?? 0) + 1;
    stats.attempted = (stats.attempted ?? 0) + 1;

    const prospect = await (
      await import('../storage')
    ).getProspect(job.prospectId);
    if (!prospect) {
      await markJobRetryOrPermanent(job, {
        error: 'prospect_missing',
        retryable: false,
        delayMs: 0,
      });
      stats.permanentlyFailed = (stats.permanentlyFailed ?? 0) + 1;
      continue;
    }

    if (await isSuppressed(job.email)) {
      await markJobSuppressed(job, 'suppressed');
      stats.suppressed++;
      prospect.status = 'unsubscribed';
      await saveProspect(prospect);
      continue;
    }

    let dailyReserved = false;
    let hourlyReserved = false;
    let providerAccepted = false;
    try {
      const daily = await reserveDailySendSlot(date, campaignId, dailyCap);
      if (!daily.ok) {
        recordSkip(stats, 'daily_cap');
        await requeueClaimedJob(job, {
          status: 'pending',
          nextRetryAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          previousStatus: 'claimed',
          lastError: 'daily_cap',
        });
        stats.retryScheduled = (stats.retryScheduled ?? 0) + 1;
        break;
      }
      dailyReserved = true;

      if (hourCap > 0) {
        const hourly = await reserveHourlySendSlot(campaignId, hourBucket, hourCap);
        if (!hourly.ok) {
          await releaseDailySendSlot(date, campaignId);
          dailyReserved = false;
          recordSkip(stats, 'hourly_cap');
          await requeueClaimedJob(job, {
            status: 'retry_scheduled',
            nextRetryAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            previousStatus: 'claimed',
            lastError: 'hourly_cap',
          });
          stats.retryScheduled = (stats.retryScheduled ?? 0) + 1;
          break;
        }
        hourlyReserved = true;
      }

      if (!(await claimProspectSend(prospect.id))) {
        if (dailyReserved) await releaseDailySendSlot(date, campaignId);
        if (hourlyReserved) await releaseHourlySendSlot(campaignId, hourBucket);
        recordSkip(stats, 'job_claim_failed');
        await requeueClaimedJob(job, {
          status: 'pending',
          nextRetryAt: new Date().toISOString(),
          previousStatus: 'claimed',
          lastError: 'prospect_claim_failed',
        });
        continue;
      }

      await markJobProcessing(job);

      const result = await sendOutreachEmail({
        prospect,
        step: job.sequenceStep,
        dryRun: false,
      });

      if (!result.ok) {
        const transient = result.retryable ?? isRetryableProviderError(result.error);
        if (dailyReserved) await releaseDailySendSlot(date, campaignId);
        if (hourlyReserved) await releaseHourlySendSlot(campaignId, hourBucket);

        const updated = await markJobRetryOrPermanent(job, {
          error: result.error ?? 'resend_error',
          statusCode: result.statusCode,
          retryable: transient,
          delayMs: retryDelayMs(job.attemptCount),
        });
        recordFailure(stats, {
          email: job.email,
          firmName: prospect.firmName,
          prospectId: prospect.id,
          reason: result.error ?? 'resend_error',
          transient,
        });
        if (updated.status === 'retry_scheduled') {
          stats.retryScheduled = (stats.retryScheduled ?? 0) + 1;
        } else {
          stats.permanentlyFailed = (stats.permanentlyFailed ?? 0) + 1;
          if (result.error?.includes('bounce')) {
            await addSuppression(job.email, 'bounce');
            prospect.status = 'bounced';
            await saveProspect(prospect);
          } else if (!transient && prospect.status === 'ready_to_send') {
            prospect.status = 'excluded';
            prospect.excludedReason = 'send_failed';
            prospect.updatedAt = new Date().toISOString();
            await saveProspect(prospect);
          }
        }
        continue;
      }

      // Persist provider acceptance BEFORE prospect/send side effects.
      // If later KV writes fail, we must not retry the provider call.
      const providerMessageId = result.messageId ?? 'unknown';
      await markJobAccepted(job, {
        providerMessageId,
        subject: result.subject,
      });
      providerAccepted = true;

      const now = new Date().toISOString();
      prospect.sequenceStep = job.sequenceStep;
      prospect.lastEmailAt = now;
      prospect.status = 'sent';
      prospect.updatedAt = now;
      await saveProspect(prospect);

      const send = createSendRecord({
        prospectId: prospect.id,
        firmName: prospect.firmName,
        prospectType: prospect.prospectType,
        email: job.email,
        campaignId: prospect.campaignId,
        sequenceStep: job.sequenceStep,
        subject: result.subject,
      });
      send.status = 'sent';
      send.sentAt = now;
      send.resendMessageId = providerMessageId;
      await saveSend(send);

      // Attach send id to the already-accepted job (best-effort).
      job.sendId = send.id;
      await markJobAccepted(job, {
        providerMessageId,
        sendId: send.id,
        subject: result.subject,
      });

      await incrementResendSendCount(date);
      resendQuota = Math.max(0, resendQuota - 1);

      emailsSentThisRun.add(job.email);
      stats.sent++;
      stats.accepted = (stats.accepted ?? 0) + 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (providerAccepted || job.providerMessageId || job.status === 'accepted') {
        // Provider already accepted — never release cap / never retry send.
        structuredRunLog('error', 'outreach.job.post_accept_persist_failed', {
          runId,
          campaignId,
          jobId: job.id,
          providerMessageId: job.providerMessageId,
          error: msg,
        });
        stats.sent++;
        stats.accepted = (stats.accepted ?? 0) + 1;
        continue;
      }
      if (dailyReserved) await releaseDailySendSlot(date, campaignId);
      if (hourlyReserved) await releaseHourlySendSlot(campaignId, hourBucket);
      await markJobRetryOrPermanent(job, {
        error: msg,
        retryable: isRetryableProviderError(msg),
        delayMs: retryDelayMs(Math.max(1, job.attemptCount)),
      });
      recordFailure(stats, {
        email: job.email,
        firmName: prospect.firmName,
        prospectId: prospect.id,
        reason: msg,
        transient: isRetryableProviderError(msg),
      });
    }
  }

  const finalQuota = await getGlobalResendQuotaRemaining(date);
  return finish(finalQuota, alreadySent, dailyCap);
}

export function emptyOutreachRunStats(): OutreachRunStats {
  return {
    queued: 0,
    sent: 0,
    skipped: 0,
    suppressed: 0,
    errors: 0,
    elapsedMs: 0,
  };
}

export function mergeOutreachRunStats(
  ...parts: OutreachRunStats[]
): OutreachRunStats {
  const out = emptyOutreachRunStats();
  for (const part of parts) {
    out.queued += part.queued;
    out.sent += part.sent;
    out.skipped += part.skipped;
    out.suppressed += part.suppressed;
    out.errors += part.errors;
    out.elapsedMs += part.elapsedMs;
    out.attempted = (out.attempted ?? 0) + (part.attempted ?? 0);
    out.failed = (out.failed ?? 0) + (part.failed ?? 0);
    out.jobsCreated = (out.jobsCreated ?? 0) + (part.jobsCreated ?? 0);
    out.jobsClaimed = (out.jobsClaimed ?? 0) + (part.jobsClaimed ?? 0);
    out.accepted = (out.accepted ?? 0) + (part.accepted ?? 0);
    out.retryScheduled = (out.retryScheduled ?? 0) + (part.retryScheduled ?? 0);
    out.permanentlyFailed = (out.permanentlyFailed ?? 0) + (part.permanentlyFailed ?? 0);
    out.abandonedRecovered = (out.abandonedRecovered ?? 0) + (part.abandonedRecovered ?? 0);
    if (part.skipReasons) {
      out.skipReasons = out.skipReasons ?? {};
      for (const [k, v] of Object.entries(part.skipReasons)) {
        const key = k as keyof NonNullable<OutreachRunStats['skipReasons']>;
        out.skipReasons[key] = (out.skipReasons[key] ?? 0) + (v ?? 0);
      }
    }
    if (part.failures?.length) {
      out.failures = [...(out.failures ?? []), ...part.failures];
    }
    if (!out.skippedReason && part.skippedReason) {
      out.skippedReason = part.skippedReason;
    }
    if (part.resendQuotaRemaining !== undefined) {
      out.resendQuotaRemaining = Math.min(
        out.resendQuotaRemaining ?? part.resendQuotaRemaining,
        part.resendQuotaRemaining,
      );
    }
    if (part.partial) out.partial = true;
    if (!out.runId && part.runId) out.runId = part.runId;
  }
  return out;
}

/**
 * Send for every shared KV campaign (RepUK WhatsApp + PSA agent-cover).
 * Each campaign keeps its own daily cap / queue; stats are returned per campaign and combined.
 */
export async function runFirmOutreachAllCampaigns(opts?: {
  dryRun?: boolean;
  limit?: number;
  maxElapsedMs?: number;
  campaignIds?: readonly string[];
}): Promise<{
  byCampaign: Record<string, OutreachRunStats>;
  combined: OutreachRunStats;
}> {
  const campaignIds = opts?.campaignIds ?? OUTREACH_CAMPAIGN_IDS;
  const byCampaign: Record<string, OutreachRunStats> = {};
  const perCampaignElapsed = opts?.maxElapsedMs
    ? Math.max(30_000, Math.floor(opts.maxElapsedMs / Math.max(1, campaignIds.length)))
    : undefined;

  for (const campaignId of campaignIds) {
    byCampaign[campaignId] = await runFirmOutreach({
      campaignId,
      dryRun: opts?.dryRun,
      limit: opts?.limit,
      maxElapsedMs: perCampaignElapsed,
    });
  }

  return {
    byCampaign,
    combined: mergeOutreachRunStats(...Object.values(byCampaign)),
  };
}
