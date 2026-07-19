import { createHash } from 'node:crypto';
import { Resend } from 'resend';
import { getKV } from '@/lib/kv';
import { isEmailRecipientAllowed } from '@/lib/email-allowlist';
import { getAutomationConfig } from './config';
import { canSendProductionAlerts } from './env-guard';
import { notificationIdempotencyKey, claimIdempotencyKey } from './idempotency';
import { logAutomationEvent } from './observability';
import type {
  DailyHealthReport,
  ErrorCategory,
  IncidentRecord,
  IncidentSeverity,
  IncidentStatus,
} from './types';

const INCIDENT_PREFIX = 'automation:incident:';
const DAILY_REPORT_PREFIX = 'automation:daily-report:';
const INCIDENT_TTL = 60 * 60 * 24 * 45;
const FROM_EMAIL = 'PoliceStationRepUK <noreply@policestationrepuk.org>';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

function escapeHtml(val: unknown): string {
  const str = typeof val === 'string' ? val : String(val ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildIncidentFingerprint(parts: {
  jobName: string;
  category: ErrorCategory | string;
  accountOrDestination?: string;
  scheduledDate?: string;
  contentId?: string;
}): string {
  const raw = [
    parts.jobName,
    parts.category,
    parts.accountOrDestination ?? '',
    parts.scheduledDate ?? '',
    parts.contentId ?? '',
  ]
    .map((s) => s.trim().toLowerCase())
    .join('|');
  return createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

async function getIncident(fingerprint: string): Promise<IncidentRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<IncidentRecord>(`${INCIDENT_PREFIX}${fingerprint}`)) ?? null;
}

async function saveIncident(incident: IncidentRecord): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(`${INCIDENT_PREFIX}${incident.fingerprint}`, incident, {
    ex: INCIDENT_TTL,
  });
}

export async function listOpenIncidents(): Promise<IncidentRecord[]> {
  // KV has no scan in our thin wrapper — return empty; admin uses known fingerprints from health report.
  return [];
}

export type NotifyDecision =
  | { action: 'send'; reason: 'new' | 'reminder' | 'resolution' | 'daily_report' }
  | { action: 'suppress'; reason: string };

export function decideNotification(input: {
  existing: IncidentRecord | null;
  severity: IncidentSeverity;
  reminderHours: number;
  isResolution?: boolean;
}): NotifyDecision {
  if (input.isResolution) {
    if (!input.existing || input.existing.status === 'resolved') {
      return { action: 'suppress', reason: 'already_resolved_or_unknown' };
    }
    return { action: 'send', reason: 'resolution' };
  }

  if (!input.existing || input.existing.status === 'resolved') {
    return { action: 'send', reason: 'new' };
  }

  if (input.existing.status === 'acknowledged' || input.existing.status === 'suppressed') {
    return { action: 'suppress', reason: `status_${input.existing.status}` };
  }

  const last = input.existing.lastEmailSentAt
    ? Date.parse(input.existing.lastEmailSentAt)
    : 0;
  const reminderMs = input.reminderHours * 60 * 60 * 1000;
  if (last && Date.now() - last < reminderMs) {
    return { action: 'suppress', reason: 'within_reminder_window' };
  }
  if (input.severity === 'info') {
    return { action: 'suppress', reason: 'info_already_reported' };
  }
  return { action: 'send', reason: 'reminder' };
}

async function sendHtmlEmail(input: {
  to: string;
  subject: string;
  html: string;
  dryRun?: boolean;
}): Promise<boolean> {
  if (input.dryRun) return false;
  if (!canSendProductionAlerts()) return false;
  if (!isEmailRecipientAllowed(input.to)) return false;
  const client = getResend();
  if (!client) return false;
  await client.emails.send({
    from: FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  return true;
}

export async function notifyIncident(input: {
  fingerprint: string;
  notificationType: string;
  jobName: string;
  severity: IncidentSeverity;
  summary: string;
  details?: string;
  category?: ErrorCategory | null;
  executionId?: string | null;
  dryRun?: boolean;
  force?: boolean;
}): Promise<{ sent: boolean; suppressed: boolean; reason: string; incident: IncidentRecord }> {
  const config = getAutomationConfig();
  const recipient = config.alertEmail;
  const now = new Date().toISOString();
  const existing = await getIncident(input.fingerprint);

  const decision = input.force
    ? ({ action: 'send', reason: 'new' } as const)
    : decideNotification({
        existing,
        severity: input.severity,
        reminderHours: config.alertReminderHours,
      });

  const incident: IncidentRecord = existing ?? {
    fingerprint: input.fingerprint,
    notificationType: input.notificationType,
    jobName: input.jobName,
    severity: input.severity,
    status: 'open',
    firstDetectedAt: now,
    lastDetectedAt: now,
    firstEmailSentAt: null,
    lastEmailSentAt: null,
    emailCount: 0,
    resolutionAt: null,
    recipient,
    relatedExecutionId: input.executionId ?? null,
    summary: input.summary,
    category: input.category ?? null,
  };

  incident.lastDetectedAt = now;
  incident.summary = input.summary;
  incident.severity = input.severity;
  incident.category = input.category ?? incident.category;
  incident.relatedExecutionId = input.executionId ?? incident.relatedExecutionId;
  if (incident.status === 'resolved') incident.status = 'open';

  if (decision.action === 'suppress') {
    await saveIncident(incident);
    logAutomationEvent('notification.duplicate_suppressed', {
      fingerprint: input.fingerprint,
      reason: decision.reason,
      jobName: input.jobName,
    });
    return { sent: false, suppressed: true, reason: decision.reason, incident };
  }

  const idem = await claimIdempotencyKey(
    notificationIdempotencyKey(input.fingerprint, `${decision.reason}:${now.slice(0, 13)}`),
    input.executionId ?? now,
    60 * 60,
  );
  // Reminder/new still proceed even if hourly idem fails on force.
  if (!idem.claimed && !input.force && decision.reason !== 'reminder') {
    // Allow first send via incident emailCount check below.
  }

  const subject =
    decision.reason === 'reminder'
      ? `[Automation reminder] ${input.summary}`
      : `[Automation alert] ${input.summary}`;

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:640px;">
      <h2 style="margin:0 0 12px;">Automation alert</h2>
      <p><strong>Status:</strong> ${escapeHtml(input.severity)}</p>
      <p><strong>Job:</strong> ${escapeHtml(input.jobName)}</p>
      <p><strong>Summary:</strong> ${escapeHtml(input.summary)}</p>
      ${input.details ? `<p><strong>Details:</strong> ${escapeHtml(input.details)}</p>` : ''}
      <p><strong>Execution ID:</strong> ${escapeHtml(input.executionId ?? 'n/a')}</p>
      <p><strong>Fingerprint:</strong> <code>${escapeHtml(input.fingerprint)}</code></p>
      <p style="color:#64748b;font-size:13px;">This alert is deduplicated. You will receive at most one reminder every ${config.alertReminderHours}h while unresolved.</p>
    </div>
  `;

  const sent = await sendHtmlEmail({
    to: recipient,
    subject,
    html,
    dryRun: input.dryRun ?? config.dryRun,
  });

  if (sent) {
    incident.emailCount += 1;
    incident.firstEmailSentAt = incident.firstEmailSentAt ?? now;
    incident.lastEmailSentAt = now;
    logAutomationEvent('notification.alert_sent', {
      fingerprint: input.fingerprint,
      jobName: input.jobName,
      reason: decision.reason,
    });
  }

  await saveIncident(incident);
  return {
    sent,
    suppressed: !sent,
    reason: sent ? decision.reason : input.dryRun || config.dryRun ? 'dry_run' : 'send_failed_or_blocked',
    incident,
  };
}

export async function resolveIncident(input: {
  fingerprint: string;
  executionId?: string | null;
  dryRun?: boolean;
  sendResolutionEmail?: boolean;
  summary?: string;
}): Promise<{ resolved: boolean; emailSent: boolean }> {
  const existing = await getIncident(input.fingerprint);
  if (!existing || existing.status === 'resolved') {
    return { resolved: false, emailSent: false };
  }

  const config = getAutomationConfig();
  const now = new Date().toISOString();
  existing.status = 'resolved';
  existing.resolutionAt = now;
  existing.lastDetectedAt = now;

  let emailSent = false;
  if (input.sendResolutionEmail !== false) {
    const decision = decideNotification({
      existing: { ...existing, status: 'open' },
      severity: existing.severity,
      reminderHours: config.alertReminderHours,
      isResolution: true,
    });
    if (decision.action === 'send') {
      emailSent = await sendHtmlEmail({
        to: existing.recipient || config.alertEmail,
        subject: `[Automation resolved] ${input.summary ?? existing.summary}`,
        html: `
          <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:640px;">
            <h2>Incident resolved</h2>
            <p>${escapeHtml(input.summary ?? existing.summary)}</p>
            <p><strong>Fingerprint:</strong> <code>${escapeHtml(input.fingerprint)}</code></p>
            <p><strong>Execution ID:</strong> ${escapeHtml(input.executionId ?? 'n/a')}</p>
          </div>
        `,
        dryRun: input.dryRun ?? config.dryRun,
      });
      if (emailSent) {
        existing.emailCount += 1;
        existing.lastEmailSentAt = now;
        logAutomationEvent('notification.incident_resolved', {
          fingerprint: input.fingerprint,
        });
      }
    }
  }

  await saveIncident(existing);
  return { resolved: true, emailSent };
}

export async function acknowledgeIncident(fingerprint: string): Promise<boolean> {
  const existing = await getIncident(fingerprint);
  if (!existing) return false;
  existing.status = 'acknowledged' satisfies IncidentStatus;
  existing.lastDetectedAt = new Date().toISOString();
  await saveIncident(existing);
  return true;
}

export async function wasDailyReportSent(date: string): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  return Boolean(await kv.get(`${DAILY_REPORT_PREFIX}${date}`));
}

export async function markDailyReportSent(date: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(`${DAILY_REPORT_PREFIX}${date}`, new Date().toISOString(), {
    ex: 60 * 60 * 24 * 14,
  });
}

export async function sendDailyHealthReportEmail(
  report: DailyHealthReport,
  options?: { force?: boolean; dryRun?: boolean },
): Promise<{ sent: boolean; reason: string }> {
  const config = getAutomationConfig();
  const dryRun = options?.dryRun ?? config.dryRun;

  if (report.overallStatus === 'Healthy' && !config.dailySuccessEmailEnabled) {
    return { sent: false, reason: 'success_email_disabled' };
  }

  if (!options?.force && (await wasDailyReportSent(report.date))) {
    logAutomationEvent('notification.duplicate_suppressed', {
      kind: 'daily_report',
      date: report.date,
    });
    return { sent: false, reason: 'already_sent' };
  }

  const subject = `[Automation ${report.overallStatus}] Daily report — ${report.date}`;
  const unresolved = report.unresolvedIssues
    .slice(0, 12)
    .map(
      (i) =>
        `<li><strong>${escapeHtml(i.severity)}</strong> ${escapeHtml(i.summary)} <code>${escapeHtml(i.fingerprint)}</code></li>`,
    )
    .join('');

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:680px;">
      <h2 style="margin:0 0 8px;">Daily automation report</h2>
      <p style="margin:0 0 16px;color:#64748b;">${escapeHtml(report.date)} · ${escapeHtml(report.overallStatus)}${report.dryRun ? ' · DRY RUN' : ''}</p>
      <table style="border-collapse:collapse;width:100%;margin-bottom:16px;">
        <tr><td style="padding:6px 0;">Buffer posts (expected / actual)</td><td style="padding:6px 0;text-align:right;"><strong>${report.bufferExpected} / ${report.bufferActual}</strong></td></tr>
        <tr><td style="padding:6px 0;">Cross-site posts (expected / actual)</td><td style="padding:6px 0;text-align:right;"><strong>${report.crossSiteExpected} / ${report.crossSiteActual}</strong></td></tr>
        <tr><td style="padding:6px 0;">Failed jobs</td><td style="padding:6px 0;text-align:right;">${report.failedJobs.length}</td></tr>
        <tr><td style="padding:6px 0;">Repairs attempted / verified</td><td style="padding:6px 0;text-align:right;">${report.repairsAttempted} / ${report.repairsVerified}</td></tr>
        <tr><td style="padding:6px 0;">Duplicates prevented</td><td style="padding:6px 0;text-align:right;">${report.duplicatesPrevented}</td></tr>
        <tr><td style="padding:6px 0;">Emails suppressed</td><td style="padding:6px 0;text-align:right;">${report.emailsSuppressed}</td></tr>
      </table>
      ${
        report.actionRequired.length
          ? `<h3>Action required</h3><ul>${report.actionRequired.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ul>`
          : ''
      }
      ${unresolved ? `<h3>Unresolved issues</h3><ul>${unresolved}</ul>` : '<p>No unresolved issues.</p>'}
      <p style="color:#64748b;font-size:13px;">Execution ID: <code>${escapeHtml(report.executionId)}</code></p>
    </div>
  `;

  const sent = await sendHtmlEmail({
    to: config.alertEmail,
    subject,
    html,
    dryRun,
  });

  if (sent || dryRun) {
    if (!dryRun) await markDailyReportSent(report.date);
    logAutomationEvent('notification.daily_report_sent', {
      date: report.date,
      status: report.overallStatus,
      dryRun,
      sent,
    });
  }

  return {
    sent,
    reason: sent ? 'sent' : dryRun ? 'dry_run' : 'send_failed_or_blocked',
  };
}

export { getIncident };
