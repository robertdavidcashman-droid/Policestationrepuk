/**
 * Legal Services Directory — email notifications.
 * Requires RESEND_API_KEY (same as lib/email.ts).
 */

import { Resend } from 'resend';
import { SITE_URL } from '@/lib/seo-layer/config';
import { LEGAL_DIRECTORY_BASE } from './constants';
import { issueLegalDirectoryAdminToken } from './admin-action-token';
import {
  adminActionButtonsHtml,
  formatListingDetailsHtml,
} from './listing-email-html';
import type { LegalDirectoryListing } from './types';

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
  const str =
    typeof val === 'string' ? val : Array.isArray(val) ? val.join(', ') : String(val ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function buildAdminActionUrls(listingId: string): Promise<{
  amendUrl: string;
  deleteUrl: string;
  adminUrl: string;
} | null> {
  try {
    const [amendToken, deleteToken] = await Promise.all([
      issueLegalDirectoryAdminToken({ listingId, action: 'amend' }),
      issueLegalDirectoryAdminToken({ listingId, action: 'delete' }),
    ]);
    return {
      amendUrl: `${SITE_URL}/admin/legal-directory/action/${encodeURIComponent(amendToken)}`,
      deleteUrl: `${SITE_URL}/admin/legal-directory/action/${encodeURIComponent(deleteToken)}`,
      adminUrl: `${SITE_URL}/admin/legal-directory`,
    };
  } catch (err) {
    console.warn('[Legal directory email] Could not issue admin action tokens:', err);
    return {
      amendUrl: `${SITE_URL}/admin/legal-directory`,
      deleteUrl: `${SITE_URL}/admin/legal-directory`,
      adminUrl: `${SITE_URL}/admin/legal-directory`,
    };
  }
}

export async function sendLegalDirectoryListingReceived(opts: {
  to: string;
  businessName: string;
  slug: string;
}): Promise<boolean> {
  const client = getResend();
  const publicUrl = `${SITE_URL}${LEGAL_DIRECTORY_BASE}/listing/${opts.slug}`;
  if (!client) {
    console.info('[Legal directory — no RESEND_API_KEY] listing published', opts);
    return false;
  }
  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: 'Your Legal Services Directory listing is now live',
      html: `
        <p>Thank you for listing <strong>${escapeHtml(opts.businessName)}</strong> on the Police Station Rep UK Legal Services Directory.</p>
        <p>Your listing is <strong>live now</strong> and searchable on the directory.</p>
        <p><a href="${escapeHtml(publicUrl)}">View your public listing</a></p>
        <p><a href="${SITE_URL}${LEGAL_DIRECTORY_BASE}/manage-listing">Manage your listing</a> (amend or delete)</p>
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
        <p>Use the secure link below to amend or delete your listing. This link expires in 7 days.</p>
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

export async function notifyAdminListingChange(
  listing: LegalDirectoryListing,
  event: 'new' | 'updated' | 'deleted' | 'claimed',
): Promise<void> {
  const actionUrls = await buildAdminActionUrls(listing.id);
  const eventLabel =
    event === 'new'
      ? 'New listing registered'
      : event === 'claimed'
        ? 'LAA listing claimed by firm'
      : event === 'updated'
        ? 'Listing updated'
        : 'Listing deleted by provider';

  const buttons =
    event === 'deleted' || !actionUrls
      ? `<p><a href="${SITE_URL}/admin/legal-directory">Open admin</a></p>`
      : adminActionButtonsHtml(actionUrls);

  await sendLegalDirectoryAdminAlert({
    subject: `[Legal Directory] ${eventLabel} — ${listing.businessName}`,
    bodyHtml: `
      <h2>${escapeHtml(eventLabel)}</h2>
      <p><strong>Business:</strong> ${escapeHtml(listing.businessName)}</p>
      <p><strong>Status:</strong> ${escapeHtml(listing.status)}</p>
      ${formatListingDetailsHtml(listing)}
      ${buttons}
    `,
  });
}

/** @deprecated Use notifyAdminListingChange */
export async function notifyAdminNewListing(listing: LegalDirectoryListing): Promise<void> {
  await notifyAdminListingChange(listing, 'new');
}

/** @deprecated High-risk listings still publish; admin is notified in the main email. */
export async function notifyAdminFlagged(opts: {
  title: string;
  detail: string;
  riskScore: number;
  flags: string[];
}): Promise<void> {
  await sendLegalDirectoryAdminAlert({
    subject: `[Legal Directory — note] ${opts.title}`,
    bodyHtml: `
      <h2>Listing note (already live)</h2>
      <p>${escapeHtml(opts.detail)}</p>
      <p><strong>Risk:</strong> ${opts.riskScore}</p>
      <p><strong>Flags:</strong> ${escapeHtml(opts.flags.join(', '))}</p>
      <p><a href="${SITE_URL}/admin/legal-directory">Open admin</a></p>
    `,
  });
}
