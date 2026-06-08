import { Resend } from 'resend';
import { SITE_URL } from '@/lib/seo-layer/config';
import type { AuditFinding } from './types';

const NOTIFY_EMAIL =
  process.env.EDITORIAL_AUDIT_NOTIFY_EMAIL?.trim() ||
  process.env.CUSTODY_DISCOVERY_NOTIFY_EMAIL?.trim() ||
  process.env.OWNER_EMAIL?.trim() ||
  process.env.ADMIN_EMAILS?.split(/[,;]/)[0]?.trim() ||
  'robertdavidcashman@gmail.com';

const FROM_EMAIL = 'PoliceStationRepUK <noreply@policestationrepuk.org>';
const MAX_ROWS = 15;

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

function formatFindingRows(findings: AuditFinding[]): string {
  const rows = findings.slice(0, MAX_ROWS);
  if (rows.length === 0) return '';
  return (
    rows
      .map(
        (f) => `
    <div style="margin:0 0 16px;padding:12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
      <p style="margin:0 0 6px;font-weight:600;">
        <a href="${escapeHtml(`${SITE_URL}${f.url}`)}" style="color:#0f2749;">${escapeHtml(f.url)}</a>
        · ${escapeHtml(f.sectionTitle)}
      </p>
      <p style="margin:0 0 6px;font-size:13px;">
        <strong>${escapeHtml(f.severity)}</strong> · <code>${escapeHtml(f.code)}</code>
      </p>
      <p style="margin:0 0 6px;font-size:13px;line-height:1.5;">${escapeHtml(f.reason)}</p>
      <p style="margin:0 0 6px;font-size:13px;line-height:1.5;"><strong>Proposed fix:</strong> ${escapeHtml(f.proposedFix)}</p>
      ${f.excerpt ? `<p style="margin:0 0 6px;font-size:12px;color:#475569;font-style:italic;">"${escapeHtml(f.excerpt)}"</p>` : ''}
      <p style="margin:0;font-size:12px;color:#64748b;">Source: <code>${escapeHtml(f.sourceFile)}</code></p>
    </div>`,
      )
      .join('') +
    (findings.length > MAX_ROWS
      ? `<p style="color:#64748b;font-size:12px;">+ ${findings.length - MAX_ROWS} more findings in today's audit bucket.</p>`
      : '')
  );
}

export async function sendEditorialAuditDigestEmail(opts: {
  findings: AuditFinding[];
  unitsScanned: number;
  date: string;
  adminEmail?: string;
}): Promise<boolean> {
  const to = opts.adminEmail?.trim() || NOTIFY_EMAIL;
  const problemCount = opts.findings.filter((f) => f.severity === 'PROBLEM').length;
  const reviewCount = opts.findings.filter((f) => f.severity === 'REVIEW').length;
  const subject = `[Editorial audit] ${opts.findings.length} content ${opts.findings.length === 1 ? 'issue' : 'issues'} flagged`;

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:640px;">
      <h2 style="margin:0 0 12px;">Editorial content audit — daily digest</h2>
      <p style="margin:0 0 16px;line-height:1.5;">
        Today's rotating scan checked <strong>${opts.unitsScanned}</strong> editorial section(s)
        and flagged <strong>${opts.findings.length}</strong>
        ${opts.findings.length === 1 ? 'issue' : 'issues'}
        (${problemCount} critical, ${reviewCount} review).
      </p>
      ${formatFindingRows(opts.findings)}
      <p style="color:#64748b;font-size:12px;line-height:1.5;margin-top:24px;">
        Date: ${escapeHtml(opts.date)} · Run <code>npm run audit:content-accuracy</code> for a full-site report.
      </p>
    </div>
  `;

  const client = getResend();
  if (!client) {
    console.info('[editorial-audit email]', subject, to);
    return false;
  }

  try {
    await client.emails.send({ from: FROM_EMAIL, to, subject, html });
    return true;
  } catch (err) {
    console.error('[editorial-audit email]', err);
    return false;
  }
}
