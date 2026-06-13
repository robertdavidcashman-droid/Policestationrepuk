import { Resend } from 'resend';
import { dailySendCap } from '../constants';
import { getDailySendCount } from '../storage';
import type {
  DiscoveryRunStats,
  EnrichmentRunStats,
  OutreachActivityRow,
  OutreachQueueRow,
  OutreachRunStats,
} from '../types';
import { buildOutreachActivityReport } from './activity-report';
import {
  markOutreachDigestSent,
  outreachDigestDate,
  wasOutreachDigestSent,
} from './daily-digest';

const NOTIFY_EMAIL =
  process.env.FIRM_OUTREACH_DIGEST_EMAIL?.trim() ||
  process.env.BUFFER_SCHEDULER_NOTIFY_EMAIL?.trim() ||
  process.env.OWNER_EMAIL?.trim() ||
  'robertdavidcashman@gmail.com';

const FROM_EMAIL = 'PoliceStationRepUK <noreply@policestationrepuk.org>';
const READY_QUEUE_LIMIT = 50;
const RECEIPTS_LIMIT = 50;

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

function escapeHtml(value: string | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderQueueTable(rows: OutreachQueueRow[]): string {
  if (rows.length === 0) {
    return '<p>No prospects are currently ready to send.</p>';
  }

  const body = rows
    .slice(0, READY_QUEUE_LIMIT)
    .map(
      (r) =>
        `<tr>
          <td>${escapeHtml(r.firmName)}</td>
          <td>${escapeHtml(r.email)}</td>
          <td>${escapeHtml(r.county)}</td>
          <td>${r.priorityScore}</td>
          <td>${r.suppressed ? escapeHtml(r.suppressionReason ?? 'suppressed') : '—'}</td>
        </tr>`,
    )
    .join('');

  return `
    <table border="1" cellpadding="6" style="border-collapse:collapse;font-size:14px;width:100%">
      <thead>
        <tr>
          <th>Firm</th>
          <th>Email</th>
          <th>County</th>
          <th>Priority</th>
          <th>Suppressed</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

function renderReceiptsTable(rows: OutreachActivityRow[]): string {
  if (rows.length === 0) {
    return '<p>No outreach emails sent yet today.</p>';
  }

  const body = rows
    .slice(0, RECEIPTS_LIMIT)
    .map(
      (r) =>
        `<tr>
          <td>${escapeHtml(r.firmName)}</td>
          <td>${escapeHtml(r.email)}</td>
          <td>${escapeHtml(r.touchLabel)}</td>
          <td>${escapeHtml(r.subject)}</td>
          <td>${escapeHtml(r.sentAt?.slice(0, 19))}</td>
          <td>${escapeHtml(r.sendStatus)}</td>
        </tr>`,
    )
    .join('');

  return `
    <table border="1" cellpadding="6" style="border-collapse:collapse;font-size:14px;width:100%">
      <thead>
        <tr>
          <th>Firm</th>
          <th>Email</th>
          <th>Touch</th>
          <th>Subject</th>
          <th>Sent at</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

export interface DailyOutreachDigestResult {
  sent: boolean;
  reason?: string;
  date: string;
}

export async function sendDailyOutreachDigest(opts?: {
  force?: boolean;
  pipeline?: {
    discovery: DiscoveryRunStats;
    enrich: EnrichmentRunStats;
    send: OutreachRunStats;
    counts: Record<string, number>;
    laaRefreshed: boolean;
  };
}): Promise<DailyOutreachDigestResult> {
  const date = outreachDigestDate();
  if (!opts?.force && (await wasOutreachDigestSent(date))) {
    return { sent: false, reason: 'already_sent_today', date };
  }

  const cap = dailySendCap();
  const sentTodayKv = await getDailySendCount(new Date().toISOString().slice(0, 10));
  const { report } = await buildOutreachActivityReport();
  const startOfUtcDay = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  );
  const todaysReceipts = report.sends
    .filter((s) => s.sentAt && Date.parse(s.sentAt) >= startOfUtcDay)
    .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''));
  const sentToday = Math.max(report.summary.sentToday, sentTodayKv, todaysReceipts.length);
  const remaining = Math.max(0, cap - sentToday);
  const readyCount = report.summary.readyToSend;
  const sendableReady = report.readyToSendProspects.filter((r) => !r.suppressed && r.email);

  const subject =
    sentToday > 0
      ? `[Firm outreach] ${sentToday} sent today — ${date}`
      : readyCount > 0
        ? `[Firm outreach] ${readyCount} ready to send — ${date}`
        : `[Firm outreach] Daily digest — ${date}`;

  const pipelineSection = opts?.pipeline
    ? `
      <h3>Pipeline run (just now)</h3>
      <ul>
        <li>LAA: ${opts.pipeline.laaRefreshed ? 'refreshed' : 'cache'}</li>
        <li>Enriched: ${opts.pipeline.enrich.processed} · emails found: ${opts.pipeline.enrich.emailsFound}</li>
        <li>Sent this run: ${opts.pipeline.send.sent} · skipped: ${opts.pipeline.send.skipped}</li>
      </ul>
    `
    : '';

  const countRows = [
    ['ready_to_send', report.summary.readyToSend],
    ['discovered', report.summary.discovered],
    ['sent (prospects)', report.summary.totalSends],
    ['no_email', report.summary.noEmail],
    ['excluded', report.summary.excluded],
    ['unsubscribed', report.summary.unsubscribed],
    ['joined_whatsapp', report.summary.joinedWhatsApp],
  ]
    .map(([k, v]) => `<tr><td>${escapeHtml(String(k))}</td><td>${v}</td></tr>`)
    .join('');

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:720px">
      <h2>Firm WhatsApp outreach — daily digest</h2>
      <p><strong>Date:</strong> ${escapeHtml(date)}</p>
      <ul>
        <li><strong>Ready to send:</strong> ${readyCount} (${sendableReady.length} with email, not suppressed)</li>
        <li><strong>Sent today:</strong> ${sentToday} / ${cap} daily cap (${remaining} remaining)</li>
        <li><strong>Sent last 7 days:</strong> ${report.summary.sentLast7Days}</li>
      </ul>
      ${pipelineSection}
      <h3>Ready to send queue</h3>
      ${renderQueueTable(report.readyToSendProspects)}
      <h3>Today's send receipts</h3>
      ${renderReceiptsTable(todaysReceipts)}
      <h3>Prospect summary</h3>
      <table border="1" cellpadding="6" style="border-collapse:collapse;font-size:14px">
        ${countRows}
      </table>
      <p style="margin-top:16px"><a href="https://policestationrepuk.org/admin/firm-outreach">Open admin dashboard</a></p>
    </div>
  `;

  const client = getResend();
  if (!client) {
    console.info('[firm-outreach digest]', subject, {
      readyCount,
      sentToday,
      receipts: todaysReceipts.length,
    });
    return { sent: false, reason: 'no_resend', date };
  }

  try {
    await client.emails.send({ from: FROM_EMAIL, to: NOTIFY_EMAIL, subject, html });
    await markOutreachDigestSent(date);
    return { sent: true, date };
  } catch (err) {
    console.warn('[firm-outreach digest]', err);
    return { sent: false, reason: 'send_failed', date };
  }
}

/** @deprecated Use sendDailyOutreachDigest */
export async function sendOutreachDigestEmail(opts: {
  discovery: DiscoveryRunStats;
  enrich: EnrichmentRunStats;
  send: OutreachRunStats;
  counts: Record<string, number>;
  laaRefreshed: boolean;
}): Promise<boolean> {
  const result = await sendDailyOutreachDigest({
    pipeline: {
      discovery: opts.discovery,
      enrich: opts.enrich,
      send: opts.send,
      counts: opts.counts,
      laaRefreshed: opts.laaRefreshed,
    },
  });
  return result.sent;
}
