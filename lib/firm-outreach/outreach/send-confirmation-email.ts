import { Resend } from 'resend';
import type { OutreachActivityRow, OutreachRunStats } from '../types';
import { operatorNotifyFromAddress } from './from-address';
import { outreachNotifyEmail } from './notify-recipient';
import { outreachApprovalDate } from './send-approval-token';

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

function renderReceiptsTable(rows: OutreachActivityRow[]): string {
  if (rows.length === 0) {
    return '<p>No receipts for this batch.</p>';
  }

  const body = rows
    .slice(0, 50)
    .map(
      (r) =>
        `<tr>
          <td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(r.firmName)}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(r.email)}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(r.touchLabel)}</td>
          <td style="padding:4px 8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(r.sentAt?.slice(0, 19))}</td>
        </tr>`,
    )
    .join('');

  return `
    <table border="1" cellpadding="6" style="border-collapse:collapse;font-size:14px;width:100%">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:6px 8px;text-align:left;">Firm</th>
          <th style="padding:6px 8px;text-align:left;">Email</th>
          <th style="padding:6px 8px;text-align:left;">Touch</th>
          <th style="padding:6px 8px;text-align:left;">Sent at</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

export async function sendOutreachSendConfirmationEmail(opts: {
  stats: OutreachRunStats;
  receipts: OutreachActivityRow[];
  readyRemaining: number;
  date?: string;
}): Promise<boolean> {
  const to = outreachNotifyEmail();
  const date = opts.date ?? outreachApprovalDate();
  const subject = `[Firm outreach] ${opts.stats.sent} sent — ${date}`;

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:720px;">
      <h2 style="margin:0 0 12px;">Firm outreach — batch sent</h2>
      <p style="margin:0 0 16px;line-height:1.5;">
        Your approval send for <strong>${escapeHtml(date)}</strong> completed.
      </p>
      <ul style="margin:0 0 16px;padding-left:20px;line-height:1.6;">
        <li><strong>Sent:</strong> ${opts.stats.sent}</li>
        <li><strong>Skipped:</strong> ${opts.stats.skipped}</li>
        <li><strong>Suppressed:</strong> ${opts.stats.suppressed}</li>
        <li><strong>Errors:</strong> ${opts.stats.errors}</li>
        <li><strong>Ready to send remaining:</strong> ${opts.readyRemaining}</li>
      </ul>
      <h3 style="margin:0 0 8px;">Send receipts</h3>
      ${renderReceiptsTable(opts.receipts)}
      <p style="margin:16px 0 0;font-size:12px;color:#64748b;">
        <a href="https://policestationrepuk.org/admin/firm-outreach">Open admin dashboard</a>
      </p>
    </div>
  `;

  const client = getResend();
  if (!client) {
    console.info('[firm-outreach confirmation]', subject, opts.stats);
    return false;
  }

  try {
    await client.emails.send({ from: operatorNotifyFromAddress(), to, subject, html });
    return true;
  } catch (err) {
    console.warn('[firm-outreach confirmation]', err);
    return false;
  }
}
