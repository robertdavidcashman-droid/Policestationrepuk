import { Resend } from 'resend';
import type { OutreachRunStats } from '../types';
import { outreachNotifyEmail } from './notify-recipient';
import { outreachApprovalDate } from './send-approval-token';

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

export interface OutreachSendFailureEmailInput {
  stats: OutreachRunStats;
  readyToSend: number;
  reason: string;
  date?: string;
}

export async function sendOutreachSendFailureEmail(
  input: OutreachSendFailureEmailInput,
): Promise<boolean> {
  const to = outreachNotifyEmail();
  const date = input.date ?? outreachApprovalDate();
  const subject = `[Firm outreach] Send run had problems — ${date}`;

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:720px;">
      <h2 style="margin:0 0 12px;">Firm outreach — send run alert</h2>
      <p style="margin:0 0 16px;padding:12px;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;line-height:1.5;">
        ${escapeHtml(input.reason)}
      </p>
      <ul style="margin:0 0 16px;padding-left:20px;line-height:1.6;">
        <li><strong>Sent:</strong> ${input.stats.sent}</li>
        <li><strong>Errors:</strong> ${input.stats.errors}</li>
        <li><strong>Skipped:</strong> ${input.stats.skipped}</li>
        <li><strong>Ready to send:</strong> ${input.readyToSend}</li>
      </ul>
      <p style="margin:0;color:#64748b;font-size:12px;">
        <a href="https://policestationrepuk.org/admin/firm-outreach">Open admin dashboard</a>
        · Check <code>RESEND_API_KEY</code> and pause state via
        <code>/api/cron/firm-outreach-status</code>
      </p>
    </div>
  `;

  const client = getResend();
  if (!client) {
    console.warn('[firm-outreach send-failure]', subject, input.reason);
    return false;
  }

  try {
    await client.emails.send({ from: FROM_EMAIL, to, subject, html });
    return true;
  } catch (err) {
    console.warn('[firm-outreach send-failure]', err);
    return false;
  }
}

/** Notify when an auto-send cron had errors or sent zero while prospects are ready. */
export async function maybeNotifyOutreachSendFailure(opts: {
  stats: OutreachRunStats;
  readyToSend: number;
  skipped?: boolean;
}): Promise<void> {
  if (opts.skipped) return;
  if (opts.stats.errors > 0) {
    await sendOutreachSendFailureEmail({
      stats: opts.stats,
      readyToSend: opts.readyToSend,
      reason: `${opts.stats.errors} send error(s) during the outreach cron run.`,
    });
    return;
  }
  if (opts.stats.sent === 0 && opts.readyToSend > 0 && opts.stats.queued > 0) {
    await sendOutreachSendFailureEmail({
      stats: opts.stats,
      readyToSend: opts.readyToSend,
      reason: `No emails sent despite ${opts.readyToSend} ready prospect(s) and ${opts.stats.queued} queued.`,
    });
  }
}
