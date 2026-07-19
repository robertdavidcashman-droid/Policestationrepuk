/** Structured automation log events. */

export type AutomationEventName =
  | 'automation.healthcheck.started'
  | 'automation.healthcheck.completed'
  | 'automation.watchdog.started'
  | 'automation.watchdog.completed'
  | 'automation.job.missed'
  | 'automation.job.duplicate_prevented'
  | 'automation.job.locked'
  | 'automation.job.lock_failed'
  | 'automation.job.recovered'
  | 'automation.job.started'
  | 'automation.job.completed'
  | 'buffer.update.missing'
  | 'buffer.update.retry_started'
  | 'buffer.update.retry_verified'
  | 'buffer.auth.failed'
  | 'crosssite.quota.deficit'
  | 'crosssite.quota.repaired'
  | 'notification.duplicate_suppressed'
  | 'notification.alert_sent'
  | 'notification.incident_resolved'
  | 'notification.daily_report_sent';

export function logAutomationEvent(
  event: AutomationEventName,
  payload: Record<string, unknown> = {},
): void {
  const line = {
    event,
    ts: new Date().toISOString(),
    ...payload,
  };
  // Never log secrets — callers must not put tokens in payload.
  console.info(`[automation] ${event}`, line);
}
