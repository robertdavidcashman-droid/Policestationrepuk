import { getSchedulerTimezone, getSchedulerPostsPerFeed } from '@/lib/buffer/config';
import {
  addDaysToLocalDate,
  localDateInTimezone,
} from '@/lib/buffer/scheduler-core';
import { getCronRunLog } from '@/lib/cron-run-log';
import { getAutomationConfig } from './config';
import { probeBufferCredentials } from './buffer-probe';
import { canPerformLiveSideEffects, requireCronSecretInProduction } from './env-guard';
import {
  countExecutionsForDay,
  createExecutionId,
  completeExecution,
  saveExecution,
  startExecution,
} from './execution-log';
import { ensureAllJobsRegistered, getJobDefinition, markJobHealthChecked } from './job-registry';
import { acquireJobLock, clearExpiredJobLock, getJobLock, releaseJobLock } from './lock';
import {
  buildIncidentFingerprint,
  notifyIncident,
  sendDailyHealthReportEmail,
} from './notifications';
import { logAutomationEvent } from './observability';
import { buildDailyHealthReport } from './report';
import { repairBufferSchedule } from './repairs/buffer';
import { inspectAndRepairCrossSiteQuota } from './repairs/cross-site';
import type {
  DailyHealthReport,
  HealthIssue,
  RepairAction,
} from './types';

export interface HealthcheckOptions {
  dryRun?: boolean;
  force?: boolean;
  now?: Date;
  /** Skip acquiring the healthcheck lock (admin nested). */
  skipLock?: boolean;
}

export interface HealthcheckResult {
  ok: boolean;
  report: DailyHealthReport;
  repairs: RepairAction[];
  issues: HealthIssue[];
  skipped?: boolean;
  reason?: string;
}

function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function inspectSchedulerHealth(
  now: Date,
  issues: HealthIssue[],
): Promise<{ failedJobs: string[]; duplicatesPrevented: number }> {
  const failedJobs: string[] = [];
  let duplicatesPrevented = 0;
  const jobs = await ensureAllJobsRegistered();

  for (const job of jobs) {
    if (job.name === 'automation-watchdog' || job.name === 'automation-daily-healthcheck') {
      continue;
    }
    const def = getJobDefinition(job.name);
    if (!def) continue;

    const cronLog = await getCronRunLog(job.name);
    const day = utcDay(now);
    const execCount = await countExecutionsForDay(job.name, day);
    if (execCount > def.expectedExecutionsPerDay) {
      duplicatesPrevented += execCount - def.expectedExecutionsPerDay;
      issues.push({
        id: `${job.name}-dup`,
        fingerprint: buildIncidentFingerprint({
          jobName: job.name,
          category: 'duplicate',
          scheduledDate: day,
        }),
        jobName: job.name,
        category: 'duplicate',
        severity: 'warning',
        summary: `${job.name} ran ${execCount} times today (expected ${def.expectedExecutionsPerDay})`,
        recoverable: false,
        requiresHumanAction: false,
      });
      logAutomationEvent('automation.job.duplicate_prevented', {
        jobName: job.name,
        execCount,
      });
    }

    // Overdue: after allowed window end and no success today/yesterday as appropriate.
    const hourUtc = now.getUTCHours();
    if (hourUtc >= def.allowedWindowEndHourUtc) {
      const lastOk = job.lastSuccessfulAt ? Date.parse(job.lastSuccessfulAt) : 0;
      const windowStart = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        def.allowedWindowStartHourUtc,
      );
      if (!lastOk || lastOk < windowStart) {
        // Also check legacy cron-run-log
        const cronOk =
          cronLog &&
          (cronLog.outcome === 'success' || cronLog.outcome === 'skipped') &&
          Date.parse(cronLog.finishedAt) >= windowStart;
        if (!cronOk) {
          failedJobs.push(job.name);
          issues.push({
            id: `${job.name}-missed`,
            fingerprint: buildIncidentFingerprint({
              jobName: job.name,
              category: 'scheduler',
              scheduledDate: day,
            }),
            jobName: job.name,
            category: 'scheduler',
            severity: 'error',
            summary: `${job.name} missed expected run window`,
            details: cronLog?.errorMessage ?? job.lastError ?? undefined,
            recoverable: job.name === 'buffer-blog-posts' || job.name === 'buffer-verify',
            requiresHumanAction: false,
          });
          logAutomationEvent('automation.job.missed', { jobName: job.name });
        }
      }
    }

    const lock = await getJobLock(job.name);
    if (lock && Date.parse(lock.expiresAt) < Date.now()) {
      await clearExpiredJobLock(job.name);
      issues.push({
        id: `${job.name}-stale-lock`,
        fingerprint: buildIncidentFingerprint({
          jobName: job.name,
          category: 'scheduler',
          contentId: 'stale-lock',
        }),
        jobName: job.name,
        category: 'scheduler',
        severity: 'warning',
        summary: `Cleared expired lock on ${job.name}`,
        recoverable: true,
        requiresHumanAction: false,
      });
    }
  }

  return { failedJobs, duplicatesPrevented };
}

export async function runDailyHealthcheck(
  options: HealthcheckOptions = {},
): Promise<HealthcheckResult> {
  const config = getAutomationConfig();
  const dryRun = options.dryRun ?? config.dryRun;
  const now = options.now ?? new Date();
  const timezone = getSchedulerTimezone();
  const today = localDateInTimezone(now, timezone);
  const reportDate = addDaysToLocalDate(today, -1);

  if (!config.enabled || !config.dailyHealthcheckEnabled) {
    const executionId = createExecutionId();
    const empty = buildDailyHealthReport({
      date: reportDate,
      executionId,
      dryRun,
      bufferExpected: 0,
      bufferActual: 0,
      crossSiteExpected: 0,
      crossSiteActual: 0,
      failedJobs: [],
      repairs: [],
      issues: [],
      duplicatesPrevented: 0,
      emailsSuppressed: 0,
      notes: ['Healthcheck disabled'],
    });
    return { ok: true, report: empty, repairs: [], issues: [], skipped: true, reason: 'disabled' };
  }

  const cronSecretError = requireCronSecretInProduction();
  const executionId = createExecutionId();

  if (!options.skipLock) {
    const lock = await acquireJobLock('automation-daily-healthcheck', executionId);
    if (!lock) {
      return {
        ok: true,
        skipped: true,
        reason: 'lock_held',
        report: buildDailyHealthReport({
          date: reportDate,
          executionId,
          dryRun,
          bufferExpected: 0,
          bufferActual: 0,
          crossSiteExpected: 0,
          crossSiteActual: 0,
          failedJobs: [],
          repairs: [],
          issues: [],
          duplicatesPrevented: 0,
          emailsSuppressed: 0,
          notes: ['Skipped — lock held'],
        }),
        repairs: [],
        issues: [],
      };
    }
  }

  const execution = startExecution({
    jobName: 'automation-daily-healthcheck',
    triggerSource: 'healthcheck',
    dryRun,
    executionId,
  });
  await saveExecution(execution);
  logAutomationEvent('automation.healthcheck.started', {
    executionId,
    dryRun,
    date: reportDate,
    liveSideEffects: canPerformLiveSideEffects(),
  });

  const issues: HealthIssue[] = [];
  const repairs: RepairAction[] = [];
  let emailsSuppressed = 0;

  try {
    if (cronSecretError) {
      issues.push({
        id: 'cron-secret',
        fingerprint: buildIncidentFingerprint({
          jobName: 'automation-daily-healthcheck',
          category: 'config',
          contentId: 'cron-secret',
        }),
        jobName: 'automation-daily-healthcheck',
        category: 'config',
        severity: 'critical',
        summary: cronSecretError,
        recoverable: false,
        requiresHumanAction: true,
      });
    }

    const { failedJobs, duplicatesPrevented } = await inspectSchedulerHealth(now, issues);

    let bufferExpected = getSchedulerPostsPerFeed();
    let bufferActual = 0;
    if (config.bufferHealthcheckEnabled) {
      const probe = await probeBufferCredentials();
      issues.push(...probe.issues);

      const bufferRepair = await repairBufferSchedule({ dryRun, now });
      repairs.push(...bufferRepair.repairs);
      bufferExpected = bufferRepair.todayRequired || bufferExpected;
      bufferActual = bufferRepair.yesterdaySent;
      // Prefer yesterday published count for the report date; also note today schedule.
      if (!bufferRepair.yesterdayOk && bufferRepair.yesterdayProblems > 0) {
        issues.push({
          id: 'buffer-yesterday',
          fingerprint: buildIncidentFingerprint({
            jobName: 'buffer-daily-report',
            category: 'scheduler',
            scheduledDate: reportDate,
          }),
          jobName: 'buffer-daily-report',
          category: 'scheduler',
          severity: 'error',
          summary: `Yesterday Buffer publish incomplete: ${bufferRepair.yesterdaySent}/${bufferRepair.yesterdayTotal} sent`,
          recoverable: true,
          requiresHumanAction: false,
        });
      }
    }

    let crossSiteExpected = 20;
    let crossSiteActual = 0;
    if (config.crossSiteHealthcheckEnabled) {
      const cross = await inspectAndRepairCrossSiteQuota({
        dryRun,
        date: reportDate,
        now,
      });
      repairs.push(...cross.repairs);
      issues.push(...cross.issues);
      crossSiteExpected = cross.expected;
      crossSiteActual = cross.actual;
    }

    // Notify / resolve incidents
    const openFingerprints = new Set<string>();
    for (const issue of issues) {
      if (issue.severity === 'info') continue;
      openFingerprints.add(issue.fingerprint);
      // Immediate alert only for human-required critical issues; others go in daily report.
      if (issue.requiresHumanAction && (issue.severity === 'critical' || issue.severity === 'error')) {
        const result = await notifyIncident({
          fingerprint: issue.fingerprint,
          notificationType: 'automation_incident',
          jobName: issue.jobName,
          severity: issue.severity,
          summary: issue.summary,
          details: issue.details,
          category: issue.category,
          executionId,
          dryRun,
        });
        if (result.suppressed) emailsSuppressed += 1;
      }
    }

    const report = buildDailyHealthReport({
      date: reportDate,
      executionId,
      dryRun,
      bufferExpected,
      bufferActual,
      crossSiteExpected,
      crossSiteActual,
      failedJobs,
      repairs,
      issues,
      duplicatesPrevented,
      emailsSuppressed,
      notes: [
        `timezone=${timezone}`,
        `autoRepair=${config.autoRepairEnabled}`,
        `liveSideEffects=${canPerformLiveSideEffects()}`,
      ],
    });

    const emailResult = await sendDailyHealthReportEmail(report, {
      force: options.force,
      dryRun,
    });
    if (!emailResult.sent) emailsSuppressed += 1;
    report.emailsSuppressed = emailsSuppressed;

    const status =
      report.overallStatus === 'Healthy'
        ? 'successful'
        : report.overallStatus === 'Repaired'
          ? 'repaired'
          : report.overallStatus === 'Action Required'
            ? 'requires_human_action'
            : 'partially_successful';

    await completeExecution(execution, {
      status,
      counts: {
        recordsInspected: issues.length + repairs.length,
        recordsRepaired: report.repairsVerified,
        recordsRetried: report.repairsAttempted,
        duplicateAttemptsPrevented: duplicatesPrevented,
        quotaExpected: bufferExpected,
        quotaAchieved: bufferActual,
      },
      repairs: repairs.map((r) => r.summary),
      notes: report.notes,
      errorMessage:
        report.overallStatus === 'Action Required'
          ? report.actionRequired[0] ?? 'action required'
          : null,
    });

    await markJobHealthChecked(
      'automation-daily-healthcheck',
      report.overallStatus === 'Healthy' || report.overallStatus === 'Repaired'
        ? 'healthy'
        : 'degraded',
      repairs[0]?.summary ?? null,
    );

    logAutomationEvent('automation.healthcheck.completed', {
      executionId,
      status: report.overallStatus,
      dryRun,
    });

    return {
      ok: report.overallStatus === 'Healthy' || report.overallStatus === 'Repaired',
      report,
      repairs,
      issues,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await completeExecution(execution, {
      status: 'failed',
      errorMessage: message,
      errorDetails: err instanceof Error ? err.stack?.slice(0, 2000) ?? null : null,
    });
    throw err;
  } finally {
    if (!options.skipLock) {
      await releaseJobLock('automation-daily-healthcheck', executionId);
    }
  }
}
