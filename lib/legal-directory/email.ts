/**
 * Legal Services Directory — email notifications.
 * Requires RESEND_API_KEY (same as lib/email.ts).
 */

import { Resend } from 'resend';
import { SITE_URL } from '@/lib/seo-layer/config';
import { LEGAL_DIRECTORY_BASE } from './constants';
import type { LegalDirectoryListing, LegalDirectoryListingStatus } from './types';

const ADMIN_EMAIL = 'robertcashman@defencelegalservices.co.uk';
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
  const str =
    typeof val === 'string' ? val : Array.isArray(val) ? val.join(', ') : String(val ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendLegalDirectoryListingReceived(opts: {
  to: string;
  businessName: string;
  status: LegalDirectoryListingStatus;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Legal directory — no RESEND_API_KEY] listing received', opts);
    return false;
  }
  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: 'Your Legal Services Directory listing — received',
      html: `
        <p>Thank you for submitting <strong>${escapeHtml(opts.businessName)}</strong> to the Police Station Rep UK Legal Services Directory.</p>
        <p>Your listing status is: <strong>${escapeHtml(opts.status)}</strong>. It will be reviewed before publication. You will receive another email when it is approved or if we need more information.</p>
        <p><a href="${SITE_URL}${LEGAL_DIRECTORY_BASE}/manage-listing">Manage your listing</a></p>
      `,
    });
    return true;
  } catch (e) {
    console.error('[Legal directory email]', e);
    return false;
  }
}

export async function sendLegalDirectoryManagementLink(opts: {
  to: string;
  token: string;
}): Promise<boolean> {
  const client = getResend();
  const url = `${SITE_URL}${LEGAL_DIRECTORY_BASE}/manage-listing/${encodeURIComponent(opts.token)}`;
  if (!client) {
    console.info('[Legal directory — management link]', url);
    return false;
  }
  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: 'Manage your Legal Services Directory listing',
      html: `
        <p>Use the secure link below to amend or request deletion of your listing. This link expires in 7 days.</p>
        <p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>
        <p>If you did not request this, ignore this email.</p>
      `,
    });
    return true;
  } catch (e) {
    console.error('[Legal directory management link]', e);
    return false;
  }
}

export async function sendLegalDirectoryAdminAlert(opts: {
  subject: string;
  bodyHtml: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Legal directory admin alert]', opts.subject, opts.bodyHtml);
    return false;
  }
  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: opts.subject,
      html: opts.bodyHtml,
    });
    return true;
  } catch (e) {
    console.error('[Legal directory admin alert]', e);
    return false;
  }
}

export async function notifyAdminNewListing(listing: LegalDirectoryListing): Promise<void> {
  await sendLegalDirectoryAdminAlert({
    subject: `[Legal Directory] New listing — ${listing.businessName} (${listing.status})`,
    bodyHtml: `
      <h2>New Legal Services Directory submission</h2>
      <p><strong>Business:</strong> ${escapeHtml(listing.businessName)}</p>
      <p><strong>Status:</strong> ${escapeHtml(listing.status)}</p>
      <p><strong>Risk score:</strong> ${listing.riskScore}</p>
      <p><strong>Flags:</strong> ${escapeHtml(listing.reviewFlags.join(', ') || 'none')}</p>
      <p><a href="${SITE_URL}/admin/legal-directory">Review in admin</a></p>
    `,
  });
}

export async function notifyAdminFlagged(opts: {
  title: string;
  detail: string;
  riskScore: number;
  flags: string[];
}): Promise<void> {
  await sendLegalDirectoryAdminAlert({
    subject: `[Legal Directory — REVIEW] ${opts.title}`,
    bodyHtml: `
      <h2>Flagged submission</h2>
      <p>${escapeHtml(opts.detail)}</p>
      <p><strong>Risk:</strong> ${opts.riskScore}</p>
      <p><strong>Flags:</strong> ${escapeHtml(opts.flags.join(', '))}</p>
      <p><a href="${SITE_URL}/admin/legal-directory/review-queue">Review queue</a></p>
    `,
  });
}
