import { getCronRunLog } from '@/lib/cron-run-log';
import { getAutomationConfig, getDeploymentId, getRuntimeEnvironment } from './config';
import { getLatestExecution } from './execution-log';
import { listJobStates, saveJobState } from './job-registry';
import { getJobLock } from './lock';
import { getIncident } from './notifications';
import type { AutomationHealthStatus, AutomationJobState } from './types';

async function hydrateJobFromCronLog(
  job: AutomationJobState,
): Promise<AutomationJobState> {
  if (job.healthStatus !== 'unknown' && job.lastSuccessfulAt) {
    return job;
  }

  const cron = await getCronRunLog(job.name);
  if (!cron) return job;

  const next: AutomationJobState = { ...job };
  if (cron.outcome === 'success' || cron.outcome === 'skipped' || cron.outcome === 'partial') {
    next.healthStatus = (cron.outcome === 'partial' ? 'degraded' : 'healthy') as AutomationHealthStatus;
    next.lastSuccessfulAt = next.lastSuccessfulAt ?? cron.finishedAt;
    next.lastAttemptedAt = next.lastAttemptedAt ?? cron.finishedAt;
    next.lastError = cron.outcome === 'partial' ? cron.errorMessage ?? null : null;
  } else if (cron.outcome === 'failed' || cron.outcome === 'error') {
    next.healthStatus = 'failing';
    next.lastFailureAt = next.lastFailureAt ?? cron.finishedAt;
    next.lastAttemptedAt = next.lastAttemptedAt ?? cron.finishedAt;
    next.lastError = cron.errorMessage ?? next.lastError;
  }

  // Persist hydrated view so admin stops showing every job as unknown.
  if (next.healthStatus !== job.healthStatus) {
    await saveJobState(next);
  }
  return next;
}

export async function getAutomationAdminStatus() {
  const config = getAutomationConfig();
  const jobsRaw = await listJobStates();
  const jobs = await Promise.all(jobsRaw.map((j) => hydrateJobFromCronLog(j)));
  const locks = await Promise.all(
    jobs.map(async (j) => ({ jobName: j.name, lock: await getJobLock(j.name) })),
  );

  const bufferScheduler = await getLatestExecution('buffer-blog-posts');
  const crossSite = await getLatestExecution('buffer-cross-site-report');
  const healthcheck = await getLatestExecution('automation-daily-healthcheck');
  const legacyBuffer = await getCronRunLog('buffer-blog-posts');

  const failingCount = jobs.filter((j) => j.healthStatus === 'failing').length;
  const overallFromJobs =
    failingCount === 0
      ? jobs.every((j) => j.healthStatus === 'unknown')
        ? 'unknown'
        : 'healthy'
      : 'failing';

  return {
    overallStatus: healthcheck?.status ?? overallFromJobs,
    environment: getRuntimeEnvironment(),
    deploymentId: getDeploymentId(),
    config: {
      enabled: config.enabled,
      dryRun: config.dryRun,
      timezone: config.timezone,
      dailyHealthcheckEnabled: config.dailyHealthcheckEnabled,
      watchdogEnabled: config.watchdogEnabled,
      autoRepairEnabled: config.autoRepairEnabled,
      dailySuccessEmailEnabled: config.dailySuccessEmailEnabled,
      schedulerSource: 'vercel-cron',
    },
    lastDailyHealthCheck: healthcheck,
    lastBufferSchedulerRun: bufferScheduler ?? legacyBuffer,
    lastCrossSiteRun: crossSite,
    jobs: jobs.map((j) => ({
      ...j,
      lock: locks.find((l) => l.jobName === j.name)?.lock ?? null,
    })),
    nextScheduled: {
      bufferBlogPosts: '5 5 * * * UTC',
      healthcheck: '15 7 * * * UTC',
      watchdog: '20 * * * * UTC',
    },
  };
}

export { getIncident };
