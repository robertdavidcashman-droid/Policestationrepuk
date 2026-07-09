import { Resend } from 'resend';
import { SITE_URL } from '@/lib/seo-layer/config';
import { issueAccessToken } from './admin-access-token';
import type { CustodyDiscoveryBatch } from './batch';
import { describeSafetyFlag, numberSafetyFlags } from './number-safety';
import type { AutoApproveDigestSummary, AutoApprovedDigestItem } from './auto-approve-digest';
import type {
  OutstandingActionHint,
  OutstandingReviewItem,
  OutstandingReviewSummary,
} from './outstanding-queue';
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

function formatAutoApprovedRows(items: AutoApprovedDigestItem[]): string {
  if (items.length === 0) {
    return '<p style="color:#64748b;">No custody numbers were auto-published in the last 24 hours.</p>';
  }

  return items
    .slice(0, 20)
    .map(({ finding: f, reasonLabel }) => {
      const ai = f.aiReview;
      const excerpt = ai?.evidence.quote ?? f.pageSnippet;
      const why = ai?.whyPublish || ai?.whyNot || f.notes || '';
      return `
    <div style="margin:0 0 16px;padding:12px;border:1px solid #d1fae5;border-radius:8px;background:#f0fdf4;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#166534;">${escapeHtml(reasonLabel)}</p>
      <p style="margin:0 0 6px;font-weight:600;">${escapeHtml(f.custodySuiteName)} · ${escapeHtml(f.forceName)}</p>
      <p style="margin:0 0 6px;font-family:monospace;">${escapeHtml(f.possiblePhoneNumber)} · score ${f.confidenceScore}${ai ? ` · AI ${ai.aiConfidence}%` : ''}</p>
      <blockquote style="margin:0 0 8px;padding:8px 12px;border-left:3px solid #86efac;background:#fff;font-size:12px;color:#334155;line-height:1.5;">${formatEvidenceQuote(excerpt)}</blockquote>
      ${why ? `<p style="margin:0 0 8px;font-size:12px;color:#0f2749;line-height:1.5;"><strong>Why approved:</strong> ${escapeHtml(why.slice(0, 400))}</p>` : ''}
      <p style="margin:0;font-size:13px;">
        <a href="${escapeHtml(f.sourceUrl)}" style="color:#0f2749;">${escapeHtml(f.sourceTitle || f.sourceUrl)}</a>
      </p>
    </div>`;
    })
    .join('')
    + (items.length > 20
      ? `<p style="color:#64748b;font-size:12px;">+ ${items.length - 20} more published today.</p>`
      : '');
}

export async function sendCustodyAutoApproveDigestEmail(opts: {
  date: string;
  summary: AutoApproveDigestSummary;
  manualPreview: OutstandingReviewItem[];
  adminEmail?: string;
}): Promise<boolean> {
  const to = opts.adminEmail?.trim() || NOTIFY_EMAIL;
  const { summary } = opts;
  const publishedCount = summary.published.length;
  const subject =
    publishedCount > 0
      ? `[Custody numbers] ${publishedCount} auto-published today`
      : '[Custody numbers] Daily auto-approval report';

  let accessToken: string;
  try {
    accessToken = await issueAccessToken({
      email: to,
      batchId: `auto_approve_${opts.date}`,
    });
  } catch (err) {
    console.error('[custody-auto-approve email] token issue failed:', err);
    return false;
  }

  const reviewUrl = `${SITE_URL}/api/admin/custody-discovery/access?token=${encodeURIComponent(accessToken)}`;

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:640px;">
      <h2 style="margin:0 0 12px;">Custody numbers — daily auto-approval report</h2>
      <p style="margin:0 0 16px;line-height:1.5;">
        Qualifying custody desk numbers are <strong>published automatically</strong> when they pass
        official-source or multi-source corroboration checks. This email summarises what was approved
        in the last 24 hours and why.
      </p>
      <ul style="margin:0 0 20px;padding-left:20px;line-height:1.6;">
        <li><strong>Auto-published (last 24h):</strong> ${publishedCount}</li>
        <li><strong>Auto-rejected (last 24h):</strong> ${summary.autoRejectedLast24h}</li>
        <li><strong>Duplicate confirmations (no change):</strong> ${summary.duplicateConfirmationsLast24h}</li>
        ${summary.needsManualReview > 0 ? `<li><strong>Still needs manual review:</strong> ${summary.needsManualReview}</li>` : ''}
      </ul>
      <h3 style="margin:0 0 12px;font-size:16px;">Published today (${publishedCount})</h3>
      ${formatAutoApprovedRows(summary.published)}
      ${opts.manualPreview.length > 0
        ? `<h3 style="margin:24px 0 12px;font-size:16px;">Needs your review (${summary.needsManualReview})</h3>
           <p style="margin:0 0 12px;font-size:13px;color:#64748b;">Conflicts and AI holds that could not be auto-resolved.</p>
           ${formatOutstandingRows(opts.manualPreview)}`
        : ''}
      <p style="margin:24px 0 16px;">
        <a href="${escapeHtml(reviewUrl)}"
           style="display:inline-block;background:#0f2749;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          Open review dashboard
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;line-height:1.5;">
        Set <code>CUSTODY_AI_AUTO_PUBLISH=false</code> on Vercel to return to manual approval with separate review emails.
      </p>
    </div>
  `;

  const client = getResend();
  if (!client) {
    console.info('[custody-auto-approve email]', subject, reviewUrl);
    return false;
  }

  try {
    await client.emails.send({ from: FROM_EMAIL, to, subject, html });
    return true;
  } catch (err) {
    console.error('[custody-auto-approve email]', err);
    return false;
  }
}

function actionHintLabel(hint: OutstandingActionHint): string {
  switch (hint) {
    case 'approve_first':
      return 'AI recommends approve';
    case 'review':
      return 'Needs your review';
    case 'likely_reject':
      return 'AI recommends reject';
    default:
      return 'Awaiting AI';
  }
}

function actionHintColor(hint: OutstandingActionHint): string {
  switch (hint) {
    case 'approve_first':
      return '#166534';
    case 'review':
      return '#92400e';
    case 'likely_reject':
      return '#991b1b';
    default:
      return '#475569';
  }
}

function formatOutstandingRows(items: OutstandingReviewItem[]): string {
  if (items.length === 0) {
    return '<p>No AI-reviewed items are waiting for a decision yet.</p>';
  }

  return items
    .map(({ finding: f, actionHint: hint }) => {
      const ai = f.aiReview;
      const section = ai?.evidence.section ?? f.sourceTitle;
      const excerpt = ai?.evidence.quote ?? f.pageSnippet;
      const why =
        ai?.recommendation === 'approve'
          ? ai.whyPublish
          : ai?.whyNot || ai?.whyPublish || '';
      const safetyFlags = f.numberFlags?.length
        ? f.numberFlags
        : numberSafetyFlags(f.normalizedPhoneNumber);
      return `
    <div style="margin:0 0 16px;padding:12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:${actionHintColor(hint)};">${escapeHtml(actionHintLabel(hint))}</p>
      <p style="margin:0 0 6px;font-weight:600;">${escapeHtml(f.custodySuiteName)} · ${escapeHtml(f.forceName)}</p>
      <p style="margin:0 0 6px;font-family:monospace;">${escapeHtml(f.possiblePhoneNumber)} · score ${f.confidenceScore} (${escapeHtml(f.confidenceLevel)})${ai ? ` · AI ${ai.aiConfidence}%` : ''}</p>
      ${safetyFlags.map((flag) => `<p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#991b1b;">⚠ ${escapeHtml(describeSafetyFlag(flag))}</p>`).join('')}
      ${f.conflictReason ? `<p style="margin:0 0 6px;font-size:12px;color:#b45309;"><strong>Conflict:</strong> ${escapeHtml(f.conflictReason)}</p>` : ''}
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#475569;">Section: ${escapeHtml(section)}</p>
      <blockquote style="margin:0 0 8px;padding:8px 12px;border-left:3px solid #cbd5e1;background:#fff;font-size:12px;color:#334155;line-height:1.5;">${formatEvidenceQuote(excerpt)}</blockquote>
      ${why ? `<p style="margin:0 0 8px;font-size:12px;color:#0f2749;line-height:1.5;">${escapeHtml(why)}</p>` : ''}
      <p style="margin:0;font-size:13px;">
        <a href="${escapeHtml(f.sourceUrl)}" style="color:#0f2749;">${escapeHtml(f.sourceTitle || f.sourceUrl)}</a>
      </p>
    </div>`;
    })
    .join('');
}

export async function sendCustodyOutstandingDigestEmail(opts: {
  date: string;
  summary: OutstandingReviewSummary;
  previewItems: OutstandingReviewItem[];
  adminEmail?: string;
}): Promise<boolean> {
  const to = opts.adminEmail?.trim() || NOTIFY_EMAIL;
  const { summary } = opts;
  const actionable = summary.items.length;
  const subject =
    summary.aiApprove > 0
      ? `[Custody review] ${summary.total} outstanding — ${summary.aiApprove} to approve`
      : `[Custody review] ${summary.total} outstanding decisions`;

  let accessToken: string;
  try {
    accessToken = await issueAccessToken({
      email: to,
      batchId: `outstanding_${opts.date}`,
    });
  } catch (err) {
    console.error('[custody-outstanding email] token issue failed:', err);
    return false;
  }

  const reviewUrl = `${SITE_URL}/api/admin/custody-discovery/access?token=${encodeURIComponent(accessToken)}`;

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:640px;">
      <h2 style="margin:0 0 12px;">Custody numbers — daily outstanding review</h2>
      <p style="margin:0 0 16px;line-height:1.5;">
        You have <strong>${summary.total}</strong> custody number ${summary.total === 1 ? 'finding' : 'findings'}
        waiting for approve or reject. Nothing publishes until you decide.
      </p>
      <ul style="margin:0 0 20px;padding-left:20px;line-height:1.6;">
        ${summary.autoPublishedLast24h > 0 ? `<li><strong>Auto-approved by AI (last 24h):</strong> ${summary.autoPublishedLast24h} — no action needed</li>` : ''}
        <li><strong>AI recommends approve:</strong> ${summary.aiApprove}${summary.officialAiApprove > 0 ? ` (${summary.officialAiApprove} from official sources)` : ''}</li>
        <li><strong>Needs your review (AI hold):</strong> ${summary.aiHold}</li>
        <li><strong>AI recommends reject:</strong> ${summary.aiReject}</li>
        <li><strong>Awaiting AI review:</strong> ${summary.awaitingAi}</li>
        ${summary.conflicts > 0 ? `<li><strong>Conflicts flagged:</strong> ${summary.conflicts}</li>` : ''}
        <li><strong>Ready for your decision:</strong> ${actionable}</li>
      </ul>
      <h3 style="margin:0 0 12px;font-size:16px;">Priority queue (${opts.previewItems.length} of ${actionable})</h3>
      ${formatOutstandingRows(opts.previewItems)}
      ${actionable > opts.previewItems.length
        ? `<p style="color:#64748b;font-size:12px;">+ ${actionable - opts.previewItems.length} more in the review dashboard.</p>`
        : ''}
      <p style="margin:24px 0 16px;">
        <a href="${escapeHtml(reviewUrl)}"
           style="display:inline-block;background:#0f2749;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          Open review dashboard
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;line-height:1.5;">
        Approve only when the source excerpt clearly supports a direct custody desk line for that suite.
        Reject switchboard, 101, solicitor, or wrong-station numbers.
      </p>
    </div>
  `;

  const client = getResend();
  if (!client) {
    console.info('[custody-outstanding email]', subject, reviewUrl);
    return false;
  }

  try {
    await client.emails.send({ from: FROM_EMAIL, to, subject, html });
    return true;
  } catch (err) {
    console.error('[custody-outstanding email]', err);
    return false;
  }
}
