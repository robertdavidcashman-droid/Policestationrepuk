import { getCronRunLog } from '@/lib/cron-run-log';
import { getAutomationConfig, getDeploymentId, getRuntimeEnvironment } from './config';
import { getLatestExecution } from './execution-log';
import { listJobStates } from './job-registry';
import { getJobLock } from './lock';
import { getIncident } from './notifications';

export async function getAutomationAdminStatus() {
  const config = getAutomationConfig();
  const jobs = await listJobStates();
  const locks = await Promise.all(
    jobs.map(async (j) => ({ jobName: j.name, lock: await getJobLock(j.name) })),
  );

  const bufferScheduler = await getLatestExecution('buffer-blog-posts');
  const crossSite = await getLatestExecution('buffer-cross-site-report');
  const healthcheck = await getLatestExecution('automation-daily-healthcheck');
  const legacyBuffer = await getCronRunLog('buffer-blog-posts');

  return {
    overallStatus: healthcheck?.status ?? 'unknown',
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
