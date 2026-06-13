import { Resend } from 'resend';
import { dailySendCap } from '../constants';
import { getDailySendCount } from '../storage';
import { SITE_URL } from '@/lib/seo-layer/config';
import { buildOutreachActivityReport } from './activity-report';
import { outreachNotifyEmail } from './notify-recipient';
import {
  issueSendApprovalToken,
  markOutreachApprovalEmailSent,
  outreachApprovalDate,
  wasOutreachApprovalEmailSent,
} from './send-approval-token';

const FROM_EMAIL = 'PoliceStationRepUK <noreply@policestationrepuk.org>';

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

export interface OutreachApprovalRequestResult {
  sent: boolean;
  reason?: string;
  date: string;
}

export async function sendOutreachApprovalRequestEmail(opts?: {
  force?: boolean;
  reminder?: boolean;
}): Promise<OutreachApprovalRequestResult> {
  const date = outreachApprovalDate();
  const to = outreachNotifyEmail();

  if (!opts?.force && !opts?.reminder && (await wasOutreachApprovalEmailSent(date))) {
    return { sent: false, reason: 'already_sent_today', date };
  }

  const cap = dailySendCap();
  const utcDate = new Date().toISOString().slice(0, 10);
  const sentTodayKv = await getDailySendCount(utcDate);
  const { report } = await buildOutreachActivityReport();
  const readyCount = report.summary.readyToSend;
  const sendableReady = report.readyToSendProspects.filter((r) => !r.suppressed && r.email);
  const remaining = Math.max(0, cap - Math.max(report.summary.sentToday, sentTodayKv));

  if (opts?.reminder && remaining === 0) {
    return { sent: false, reason: 'daily_cap_reached', date };
  }

  const { jti } = await issueSendApprovalToken({ date, recipient: to });
  const approveUrl = `${SITE_URL}/outreach/send-approve/${jti}`;

  const queuePreview = report.readyToSendProspects
    .slice(0, 10)
    .map(
      (r) =>
        `<li>${escapeHtml(r.firmName)} — ${escapeHtml(r.email)} (${escapeHtml(r.county)})</li>`,
    )
    .join('');

  const subject = opts?.reminder
    ? `[Firm outreach] Reminder: ${readyCount} ready — send up to ${remaining} today`
    : `[Firm outreach] ${readyCount} ready to send — click to send up to ${remaining} today`;

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:720px;">
      <h2 style="margin:0 0 12px;">Firm WhatsApp outreach — ready to send</h2>
      <p style="margin:0 0 16px;line-height:1.5;">
        <strong>${escapeHtml(String(readyCount))}</strong> prospects are ready
        (${sendableReady.length} with email, not suppressed).
        You can send up to <strong>${remaining}</strong> more today (cap ${cap}).
        Already sent today: ${Math.max(report.summary.sentToday, sentTodayKv)}.
      </p>
      <div style="margin:24px 0;padding:18px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">
        <p style="margin:0 0 14px;font-size:14px;font-weight:600;">Click to review and send:</p>
        <a href="${escapeHtml(approveUrl)}"
           style="display:inline-block;padding:14px 28px;background:#059669;color:#ffffff;
                  text-decoration:none;font-weight:700;font-size:16px;border-radius:8px;
                  border:1px solid #047857">
          Ready to send
        </a>
        <p style="margin:14px 0 0;font-size:12px;color:#64748b;line-height:1.5">
          Opens a confirmation page — nothing is sent until you click Confirm there
          (safe if your email client preloads links).
        </p>
      </div>
      ${
        queuePreview
          ? `<p style="margin:0 0 8px;font-weight:600;">Top of queue:</p><ul style="margin:0 0 16px;padding-left:20px;line-height:1.6;font-size:13px;">${queuePreview}</ul>`
          : '<p style="margin:0 0 16px;">No prospects are currently ready to send.</p>'
      }
      <p style="margin:0;color:#64748b;font-size:12px;">
        <a href="https://policestationrepuk.org/admin/firm-outreach">Open admin dashboard</a>
      </p>
    </div>
  `;

  const client = getResend();
  if (!client) {
    console.info('[firm-outreach approval email]', subject, { readyCount, remaining });
    return { sent: false, reason: 'no_resend', date };
  }

  try {
    await client.emails.send({ from: FROM_EMAIL, to, subject, html });
    if (!opts?.reminder) {
      await markOutreachApprovalEmailSent(date);
    }
    return { sent: true, date };
  } catch (err) {
    console.warn('[firm-outreach approval email]', err);
    return { sent: false, reason: 'send_failed', date };
  }
}
