/** Automation configuration — reuses existing Buffer/cron env names where equivalent. */

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === undefined || raw === '') return defaultValue;
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
  if (['0', 'false', 'no', 'off'].includes(raw)) return false;
  return defaultValue;
}

function envInt(name: string, defaultValue: number, min?: number, max?: number): number {
  const raw = process.env[name]?.trim();
  const n = raw ? Number.parseInt(raw, 10) : defaultValue;
  if (!Number.isFinite(n)) return defaultValue;
  let v = n;
  if (typeof min === 'number') v = Math.max(min, v);
  if (typeof max === 'number') v = Math.min(max, v);
  return v;
}

export interface AutomationConfig {
  enabled: boolean;
  dryRun: boolean;
  timezone: string;
  dailyHealthcheckEnabled: boolean;
  dailyHealthcheckHourUtc: number;
  watchdogEnabled: boolean;
  bufferHealthcheckEnabled: boolean;
  crossSiteHealthcheckEnabled: boolean;
  autoRepairEnabled: boolean;
  autoRetryEnabled: boolean;
  maxRetryCount: number;
  stuckJobTimeoutMinutes: number;
  lockTimeoutMinutes: number;
  alertReminderHours: number;
  dailySuccessEmailEnabled: boolean;
  alertEmail: string;
  crossSiteRemoteRepairEnabled: boolean;
  allowNonProd: boolean;
}

export function getAutomationAlertEmail(): string {
  return (
    process.env.AUTOMATION_ALERT_EMAIL?.trim() ||
    process.env.BUFFER_SCHEDULER_NOTIFY_EMAIL?.trim() ||
    process.env.CUSTODY_DISCOVERY_NOTIFY_EMAIL?.trim() ||
    process.env.OWNER_EMAIL?.trim() ||
    process.env.ADMIN_EMAILS?.split(/[,;]/)[0]?.trim() ||
    'robertdavidcashman@gmail.com'
  );
}

export function getAutomationConfig(): AutomationConfig {
  return {
    enabled: envFlag('AUTOMATION_ENABLED', true),
    // Safe default for first production rollout — set AUTOMATION_DRY_RUN=0 to apply repairs/emails.
    dryRun: envFlag('AUTOMATION_DRY_RUN', true),
    timezone:
      process.env.AUTOMATION_TIMEZONE?.trim() ||
      process.env.BUFFER_SCHEDULER_TIMEZONE?.trim() ||
      'Europe/London',
    dailyHealthcheckEnabled: envFlag('DAILY_HEALTHCHECK_ENABLED', true),
    dailyHealthcheckHourUtc: envInt('DAILY_HEALTHCHECK_HOUR', 7, 0, 23),
    watchdogEnabled: envFlag('WATCHDOG_ENABLED', true),
    bufferHealthcheckEnabled: envFlag('BUFFER_HEALTHCHECK_ENABLED', true),
    crossSiteHealthcheckEnabled: envFlag('CROSS_SITE_HEALTHCHECK_ENABLED', true),
    autoRepairEnabled: envFlag('AUTO_REPAIR_ENABLED', false),
    autoRetryEnabled: envFlag('AUTO_RETRY_ENABLED', true),
    maxRetryCount: envInt('MAX_RETRY_COUNT', 3, 0, 10),
    stuckJobTimeoutMinutes: envInt('STUCK_JOB_TIMEOUT_MINUTES', 120, 5, 1440),
    lockTimeoutMinutes: envInt('LOCK_TIMEOUT_MINUTES', 30, 1, 240),
    alertReminderHours: envInt('ALERT_REMINDER_HOURS', 24, 1, 168),
    dailySuccessEmailEnabled: envFlag('DAILY_SUCCESS_EMAIL_ENABLED', true),
    alertEmail: getAutomationAlertEmail(),
    crossSiteRemoteRepairEnabled: envFlag('CROSS_SITE_REMOTE_REPAIR_ENABLED', false),
    allowNonProd: envFlag('AUTOMATION_ALLOW_NON_PROD', false),
  };
}

export function getDeploymentId(): string | null {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.VERCEL_DEPLOYMENT_ID?.trim() ||
    process.env.GIT_COMMIT?.trim() ||
    null
  );
}

export function getRuntimeEnvironment(): string {
  return (
    process.env.VERCEL_ENV?.trim() ||
    process.env.NODE_ENV?.trim() ||
    'development'
  );
}
