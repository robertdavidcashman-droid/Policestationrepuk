import { Resend } from 'resend';
import { SITE_URL } from '@/lib/seo-layer/config';
import { issueAccessToken } from './admin-access-token';
import type { CustodyDiscoveryBatch } from './batch';
import type { CustodyNumberFinding } from './types';

const NOTIFY_EMAIL =
  process.env.CUSTODY_DISCOVERY_NOTIFY_EMAIL?.trim() ||
  process.env.OWNER_EMAIL?.trim() ||
  process.env.ADMIN_EMAILS?.split(/[,;]/)[0]?.trim() ||
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
    .replace(/"/g, '&quot;');
}

function formatEvidenceQuote(quote: string): string {
  return escapeHtml(quote.replace(/\*\*/g, ''));
}

function formatFindingRows(findings: CustodyNumberFinding[]): string {
  const rows = findings.slice(0, 6);
  if (rows.length === 0) return '<p>No AI-reviewed findings to show yet.</p>';
  return rows
    .map((f) => {
      const ai = f.aiReview;
      const section = ai?.evidence.section ?? f.sourceTitle;
      const excerpt = ai?.evidence.quote ?? f.pageSnippet;
      const why =
        ai?.recommendation === 'approve'
          ? ai.whyPublish
          : ai?.whyNot || ai?.whyPublish || '';
      const aiBadge = ai
        ? `AI: ${ai.recommendation.toUpperCase()} (${ai.aiConfidence}%)`
        : '';
      return `
    <div style="margin:0 0 16px;padding:12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
      <p style="margin:0 0 6px;font-weight:600;">${escapeHtml(f.custodySuiteName)}</p>
      <p style="margin:0 0 6px;font-family:monospace;">${escapeHtml(f.possiblePhoneNumber)} · score ${f.confidenceScore} (${escapeHtml(f.confidenceLevel)})${aiBadge ? ` · ${escapeHtml(aiBadge)}` : ''}</p>
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#475569;">Section: ${escapeHtml(section)}</p>
      <blockquote style="margin:0 0 8px;padding:8px 12px;border-left:3px solid #cbd5e1;background:#fff;font-size:12px;color:#334155;line-height:1.5;">${formatEvidenceQuote(excerpt)}</blockquote>
      ${why ? `<p style="margin:0 0 8px;font-size:12px;color:#0f2749;line-height:1.5;"><strong>Why publish:</strong> ${escapeHtml(why)}</p>` : ''}
      <p style="margin:0;font-size:13px;">
        <a href="${escapeHtml(f.sourceUrl)}" style="color:#0f2749;">${escapeHtml(f.sourceTitle || f.sourceUrl)}</a>
      </p>
    </div>`;
    })
    .join('') + (findings.length > 6
    ? `<p style="color:#64748b;font-size:12px;">+ ${findings.length - 6} more in the review dashboard.</p>`
    : '');
}

export async function sendCustodyDiscoveryBatchEmail(opts: {
  batch: CustodyDiscoveryBatch;
  findings: CustodyNumberFinding[];
  adminEmail?: string;
}): Promise<boolean> {
  const to = opts.adminEmail?.trim() || NOTIFY_EMAIL;
  const newCount = opts.batch.findingIds.length;
  const conflicts = opts.batch.stats.conflictsFlagged ?? 0;
  const subject = `[Custody discovery] ${newCount} new ${newCount === 1 ? 'finding' : 'findings'} to review`;

  let accessToken: string;
  try {
    accessToken = await issueAccessToken({ email: to, batchId: opts.batch.id });
  } catch (err) {
    console.error('[custody-discovery email] token issue failed:', err);
    return false;
  }

  const reviewUrl = `${SITE_URL}/api/admin/custody-discovery/access?token=${encodeURIComponent(accessToken)}`;
  const elapsedSec = Math.round((opts.batch.stats.elapsedMs ?? 0) / 1000);

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:640px;">
      <h2 style="margin:0 0 12px;">Custody number discovery — batch complete</h2>
      <p style="margin:0 0 16px;line-height:1.5;">
        A scheduled crawl finished and found <strong>${newCount}</strong> new possible custody
        ${newCount === 1 ? 'number' : 'numbers'} with source evidence. Nothing has been published —
        admin approval is required.
      </p>
      <ul style="margin:0 0 20px;padding-left:20px;line-height:1.6;">
        <li>Suites scanned: ${opts.batch.stats.suitesScanned}</li>
        <li>New findings: ${newCount}</li>
        ${conflicts > 0 ? `<li>Possible conflicts flagged: ${conflicts}</li>` : ''}
        <li>Run time: ${elapsedSec}s</li>
      </ul>
      ${formatFindingRows(opts.findings)}
      <p style="margin:24px 0 16px;">
        <a href="${escapeHtml(reviewUrl)}"
           style="display:inline-block;background:#0f2749;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          Open review dashboard
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;line-height:1.5;">
        This link signs you into the admin review page automatically and expires in 7 days.
        Each finding includes a source URL and snippet — approve only when evidence clearly supports a direct custody line.
      </p>
    </div>
  `;

  const client = getResend();
  if (!client) {
    console.info('[custody-discovery email]', subject, reviewUrl);
    return false;
  }

  try {
    await client.emails.send({ from: FROM_EMAIL, to, subject, html });
    return true;
  } catch (err) {
    console.error('[custody-discovery email]', err);
    return false;
  }
}
