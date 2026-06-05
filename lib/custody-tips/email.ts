/**
 * Custody tip admin notifications (conflicts needing review).
 */

import { Resend } from 'resend';
import { SITE_URL } from '@/lib/seo-layer/config';

const ADMIN_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
  process.env.OWNER_EMAIL?.trim() ||
  'robertdavidcashman@gmail.com';
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
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function notifyAdminCustodyConflict(opts: {
  stationId: string;
  stationName: string;
  stationSlug: string;
  confirmedBy: number;
}): Promise<boolean> {
  const adminUrl = `${SITE_URL}/admin/custody-tips`;
  const stationUrl = `${SITE_URL}/police-station/${encodeURIComponent(opts.stationSlug)}`;
  const subject = `[Custody tips] Conflicting numbers — ${opts.stationName}`;
  const bodyHtml = `
    <h2>Custody number conflict</h2>
    <p>Reps have submitted different custody desk numbers for <strong>${escapeHtml(opts.stationName)}</strong>.</p>
    <p><strong>Station ID:</strong> ${escapeHtml(opts.stationId)}</p>
    <p><strong>Backers on leading number:</strong> ${opts.confirmedBy}</p>
    <p><a href="${escapeHtml(stationUrl)}">View station page</a> · <a href="${escapeHtml(adminUrl)}">Open custody tips admin</a></p>
  `;

  const client = getResend();
  if (!client) {
    console.info('[custody-tips admin]', subject);
    return false;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      html: bodyHtml,
    });
    return true;
  } catch (err) {
    console.error('[custody-tips admin email]', err);
    return false;
  }
}
