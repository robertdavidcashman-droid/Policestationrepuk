import { getSchedulerTimezone } from '@/lib/buffer/config';
import { localDateInTimezone } from '@/lib/buffer/scheduler-core';
import { verifyRepukBufferSchedule } from '@/lib/buffer/engine-run';
import { getCronRunLog } from '@/lib/cron-run-log';
import { getAutomationConfig } from './config';
import { probeBufferCredentials } from './buffer-probe';
import { canPerformLiveSideEffects } from './env-guard';
import {
  completeExecution,
  createExecutionId,
  saveExecution,
  startExecution,
} from './execution-log';
import { getJobState, markJobHealthChecked } from './job-registry';
import { acquireJobLock, clearExpiredJobLock, getJobLock, releaseJobLock } from './lock';
import { buildIncidentFingerprint, notifyIncident } from './notifications';
import { logAutomationEvent } from './observability';
import type { RepairAction, WatchdogResult } from './types';

const CRITICAL_JOBS = ['buffer-blog-posts', 'buffer-verify'] as const;

export interface WatchdogOptions {
  dryRun?: boolean;
  now?: Date;
  skipLock?: boolean;
}

/**
 * Lightweight hourly watchdog — overdue critical jobs, stuck locks, auth failure.
 * Does not run a full audit.
 */
export async function runAutomationWatchdog(
  options: WatchdogOptions = {},
): Promise<WatchdogResult> {
  const config = getAutomationConfig();
  const dryRun = options.dryRun ?? config.dryRun;
  const now = options.now ?? new Date();
  const executionId = createExecutionId();

  if (!config.enabled || !config.watchdogEnabled) {
    return {
      ok: true,
      executionId,
      dryRun,
      overdueJobs: [],
      stuckJobs: [],
      authFailure: false,
      repairs: [],
      alertsSent: 0,
      notes: ['Watchdog disabled'],
    };
  }

  if (!options.skipLock) {
    const lock = await acquireJobLock('automation-watchdog', executionId);
    if (!lock) {
      return {
        ok: true,
        executionId,
        dryRun,
        overdueJobs: [],
        stuckJobs: [],
        authFailure: false,
        repairs: [],
        alertsSent: 0,
        notes: ['Skipped — lock held'],
      };
    }
  }

  const execution = startExecution({
    jobName: 'automation-watchdog',
    triggerSource: 'watchdog',
    dryRun,
    executionId,
  });
  await saveExecution(execution);
  logAutomationEvent('automation.watchdog.started', { executionId, dryRun });

  const overdueJobs: string[] = [];
  const stuckJobs: string[] = [];
  const repairs: RepairAction[] = [];
  let alertsSent = 0;
  let authFailure = false;
  const notes: string[] = [];

  try {
    // Stuck / expired locks
    for (const jobName of [
      ...CRITICAL_JOBS,
      'automation-daily-healthcheck',
      'buffer-daily-report',
    ]) {
      const lock = await getJobLock(jobName);
      if (!lock) continue;
      if (Date.parse(lock.expiresAt) < Date.now()) {
        stuckJobs.push(jobName);
        if (!dryRun) {
          const cleared = await clearExpiredJobLock(jobName);
          repairs.push({
            id: `clear-lock-${jobName}`,
            kind: 'clear_expired_lock',
            target: jobName,
            attempted: cleared,
            verified: cleared,
            dryRun: false,
            summary: cleared
              ? `Cleared expired lock on ${jobName}`
              : `Failed to clear lock on ${jobName}`,
          });
        } else {
          repairs.push({
            id: `clear-lock-${jobName}`,
            kind: 'clear_expired_lock',
            target: jobName,
            attempted: false,
            verified: false,
            dryRun: true,
            summary: `Would clear expired lock on ${jobName}`,
          });
        }
      } else {
        // Lock held beyond stuck timeout from acquiredAt
        const ageMin = (Date.now() - Date.parse(lock.acquiredAt)) / 60000;
        if (ageMin > config.stuckJobTimeoutMinutes) {
          stuckJobs.push(jobName);
        }
      }
    }

    // Auth probe (cheap)
    const probe = await probeBufferCredentials();
    authFailure = probe.issues.some((i) => i.category === 'auth' || i.category === 'config');
    if (authFailure) {
      const critical = probe.issues.find((i) => i.requiresHumanAction);
      if (critical) {
        const result = await notifyIncident({
          fingerprint: critical.fingerprint,
          notificationType: 'buffer_auth',
          jobName: 'buffer-blog-posts',
          severity: 'critical',
          summary: critical.summary,
          details: critical.details,
          category: critical.category,
          executionId,
          dryRun,
        });
        if (result.sent) alertsSent += 1;
        logAutomationEvent('buffer.auth.failed', { summary: critical.summary });
      }
    }

    // Overdue buffer-blog-posts after 06:30 UTC
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    if (hour > 6 || (hour === 6 && minute >= 30)) {
      const state = await getJobState('buffer-blog-posts');
      const timezone = getSchedulerTimezone();
      const today = localDateInTimezone(now, timezone);
      const cronLog = await getCronRunLog('buffer-blog-posts');
      const successToday =
        (state?.lastSuccessfulAt &&
          localDateInTimezone(new Date(state.lastSuccessfulAt), timezone) === today) ||
        (cronLog &&
          (cronLog.outcome === 'success' || cronLog.outcome === 'skipped') &&
          localDateInTimezone(new Date(cronLog.finishedAt), timezone) === today);

      if (!successToday) {
        overdueJobs.push('buffer-blog-posts');
        logAutomationEvent('automation.job.missed', { jobName: 'buffer-blog-posts' });

        if (!dryRun && config.autoRepairEnabled && canPerformLiveSideEffects() && !authFailure) {
          const verify = await verifyRepukBufferSchedule({ now, gapFill: true });
          repairs.push({
            id: 'watchdog-gap-fill',
            kind: 'buffer_gap_fill',
            target: today,
            attempted: true,
            verified: verify.ok,
            dryRun: false,
            summary: verify.ok
              ? `Watchdog gap-fill OK ${verify.scheduledCount}/${verify.requiredCount}`
              : `Watchdog gap-fill incomplete ${verify.scheduledCount}/${verify.requiredCount}`,
          });
          logAutomationEvent('automation.job.recovered', {
            jobName: 'buffer-blog-posts',
            ok: verify.ok,
          });
        } else {
          repairs.push({
            id: 'watchdog-gap-fill',
            kind: 'buffer_gap_fill',
            target: 'buffer-blog-posts',
            attempted: false,
            verified: false,
            dryRun: true,
            summary: 'Would gap-fill missed buffer-blog-posts',
          });
        }

        const result = await notifyIncident({
          fingerprint: buildIncidentFingerprint({
            jobName: 'buffer-blog-posts',
            category: 'scheduler',
            scheduledDate: localDateInTimezone(now, getSchedulerTimezone()),
          }),
          notificationType: 'job_overdue',
          jobName: 'buffer-blog-posts',
          severity: 'error',
          summary: 'Critical job buffer-blog-posts appears overdue',
          executionId,
          dryRun,
        });
        if (result.sent) alertsSent += 1;
        if (result.suppressed) notes.push('overdue alert suppressed (dedup)');
      }
    }

    const ok = overdueJobs.length === 0 && !authFailure;
    await completeExecution(execution, {
      status: ok ? 'successful' : authFailure ? 'requires_human_action' : 'partially_successful',
      counts: {
        recordsRepaired: repairs.filter((r) => r.verified).length,
      },
      repairs: repairs.map((r) => r.summary),
      notes,
    });
    await markJobHealthChecked(
      'automation-watchdog',
      ok ? 'healthy' : 'degraded',
      repairs[0]?.summary ?? null,
    );

    logAutomationEvent('automation.watchdog.completed', {
      executionId,
      ok,
      overdueJobs,
      stuckJobs,
      authFailure,
    });

    return {
      ok,
      executionId,
      dryRun,
      overdueJobs,
      stuckJobs,
      authFailure,
      repairs,
      alertsSent,
      notes,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await completeExecution(execution, {
      status: 'failed',
      errorMessage: message,
    });
    throw err;
  } finally {
    if (!options.skipLock) {
      await releaseJobLock('automation-watchdog', executionId);
    }
  }
}
