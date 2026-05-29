import { SITE_URL } from '@/lib/seo-layer/config';
import { LEGAL_DIRECTORY_BASE } from './constants';
import type { LegalDirectoryListing } from './types';

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

function row(label: string, value: string | undefined | null): string {
  if (!value?.trim()) return '';
  return `<tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#475569;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:6px 0;color:#0f172a">${escapeHtml(value)}</td></tr>`;
}

export function formatListingDetailsHtml(listing: LegalDirectoryListing): string {
  const publicUrl = `${SITE_URL}${LEGAL_DIRECTORY_BASE}/listing/${listing.slug}`;
  const rows = [
    row('Business name', listing.businessName),
    row('Category', listing.category),
    row('Contact', listing.contactPerson),
    row('Email', listing.email),
    row('Phone', listing.phone),
    row('Emergency phone', listing.emergencyPhone),
    row('Website', listing.websiteUrl),
    row('Address', [listing.addressLine1, listing.addressLine2].filter(Boolean).join(', ')),
    row('Town', listing.town),
    row('County', listing.county),
    row('Postcode', listing.postcode),
    row('Region', listing.region),
    row('Areas covered', listing.areasCovered),
    row('Police stations', listing.policeStationsCovered),
    row('Courts', listing.courtsCovered),
    row('Description', listing.description),
    row('Specialisms', listing.specialisms),
    row('Legal aid', listing.legalAidStatus),
    row('24-hour availability', listing.availability24Hour ? 'Yes' : 'No'),
    row('Regulatory body', listing.regulatoryBody),
    row('Regulatory number', listing.regulatoryNumber),
    row('Accreditation', listing.accreditationDetails),
    row('Public URL', publicUrl),
    row('Risk score', String(listing.riskScore)),
    row('Flags', listing.reviewFlags.join(', ') || 'none'),
  ]
    .filter(Boolean)
    .join('');

  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.5">
      ${rows}
    </table>
    <p style="margin:16px 0 0;font-size:13px"><a href="${escapeHtml(publicUrl)}">View public listing</a></p>
  `;
}

export function adminActionButtonsHtml(opts: {
  amendUrl: string;
  deleteUrl: string;
  adminUrl: string;
}): string {
  return `
    <div style="margin:24px 0;padding:18px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">
      <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#0f172a">Admin actions</p>
      <p style="margin:0 0 16px;font-size:13px;color:#475569">
        Amend or remove this listing using the buttons below, or open the combined admin area.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0">
        <tr>
          <td style="padding-right:10px">
            <a href="${escapeHtml(opts.amendUrl)}"
               style="display:inline-block;padding:12px 22px;background:#1e3a8a;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">
              Amend listing
            </a>
          </td>
          <td style="padding-right:10px">
            <a href="${escapeHtml(opts.deleteUrl)}"
               style="display:inline-block;padding:12px 22px;background:#b91c1c;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">
              Delete listing
            </a>
          </td>
          <td>
            <a href="${escapeHtml(opts.adminUrl)}"
               style="display:inline-block;padding:12px 22px;background:#ffffff;color:#1e3a8a;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;border:1px solid #cbd5e1">
              Open admin
            </a>
          </td>
        </tr>
      </table>
    </div>
  `;
}
