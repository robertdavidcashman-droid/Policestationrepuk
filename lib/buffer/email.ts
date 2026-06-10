import { Resend } from 'resend';

const NOTIFY_EMAIL =
  process.env.BUFFER_SCHEDULER_NOTIFY_EMAIL?.trim() ||
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

export interface BufferSchedulerFailureEmailInput {
  error: string;
  date?: string;
  partialPosts?: Array<{ slug: string; channelService: string; dueAt: string | null }>;
  adminEmail?: string;
}

export interface BufferSchedulerSkippedEmailInput {
  reason: string;
  date?: string;
  postCount?: number;
  adminEmail?: string;
}

export interface BufferHealthEmailInput {
  date?: string;
  issueCount: number;
  issues: Array<Record<string, unknown>>;
  adminEmail?: string;
}

export interface TrafficDigestEmailInput {
  date?: string;
  gbpOk: boolean;
  gbpIssueCount: number;
  crossDomainOk: boolean;
  crossDomainIssues: string[];
  scheduledCount?: number;
  adminEmail?: string;
}

export async function sendBufferSchedulerSkippedEmail(
  input: BufferSchedulerSkippedEmailInput,
): Promise<boolean> {
  const to = input.adminEmail?.trim() || NOTIFY_EMAIL;
  const dateLabel = input.date ?? 'unknown date';
  const subject = `[Buffer scheduler] Skipped — ${dateLabel}`;

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:640px;">
      <h2 style="margin:0 0 12px;">Buffer blog scheduler skipped</h2>
      <p style="margin:0 0 16px;line-height:1.5;">
        The daily cron for <strong>${escapeHtml(dateLabel)}</strong> did not schedule new posts because a run
        is already recorded for today.
      </p>
      <p style="margin:0 0 16px;padding:12px;border:1px solid #fde68a;border-radius:8px;background:#fffbeb;font-size:14px;line-height:1.5;">
        ${escapeHtml(input.reason)}
      </p>
      <p style="margin:0 0 16px;line-height:1.5;">
        Existing run had <strong>${escapeHtml(String(input.postCount ?? 0))}</strong> post(s) in KV.
        To re-run manually, call the cron with <code>?force=1</code> or run
        <code>npm run buffer:replace-today</code>.
      </p>
      <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">
        This is informational — not a failure. No action is required unless you expected new posts today.
      </p>
    </div>
  `;

  const client = getResend();
  if (!client) {
    console.warn('[buffer-scheduler email]', subject, input.reason);
    return false;
  }

  try {
    await client.emails.send({ from: FROM_EMAIL, to, subject, html });
    return true;
  } catch (err) {
    console.error('[buffer-scheduler email]', err);
    return false;
  }
}

export async function sendBufferSchedulerFailureEmail(
  input: BufferSchedulerFailureEmailInput,
): Promise<boolean> {
  const to = input.adminEmail?.trim() || NOTIFY_EMAIL;
  const dateLabel = input.date ?? 'unknown date';
  const subject = `[Buffer scheduler] Failed — ${dateLabel}`;

  const partialHtml =
    input.partialPosts && input.partialPosts.length > 0
      ? `<p style="margin:0 0 12px;"><strong>Posts scheduled before failure:</strong></p>
         <ul style="margin:0 0 16px;padding-left:20px;line-height:1.6;">
           ${input.partialPosts
             .map(
               (p) =>
                 `<li>${escapeHtml(p.slug)} (${escapeHtml(p.channelService)}) — ${escapeHtml(p.dueAt ?? 'no time')}</li>`,
             )
             .join('')}
         </ul>`
      : '';

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:640px;">
      <h2 style="margin:0 0 12px;">Buffer blog scheduler failed</h2>
      <p style="margin:0 0 16px;line-height:1.5;">
        The daily cron that schedules random blog posts to Buffer did not complete successfully
        for <strong>${escapeHtml(dateLabel)}</strong>.
      </p>
      <p style="margin:0 0 16px;padding:12px;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;font-family:monospace;font-size:13px;line-height:1.5;">
        ${escapeHtml(input.error)}
      </p>
      ${partialHtml}
      <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">
        Check Vercel cron logs for <code>/api/cron/buffer-blog-posts</code>, confirm
        <code>BUFFER_API_KEY</code> and Buffer channel connections, then retry manually if needed.
      </p>
    </div>
  `;

  const client = getResend();
  if (!client) {
    console.error('[buffer-scheduler email]', subject, input.error);
    return false;
  }

  try {
    await client.emails.send({ from: FROM_EMAIL, to, subject, html });
    return true;
  } catch (err) {
    console.error('[buffer-scheduler email]', err);
    return false;
  }
}

export async function sendBufferHealthFailureEmail(
  input: BufferHealthEmailInput,
): Promise<boolean> {
  const to = input.adminEmail?.trim() || NOTIFY_EMAIL;
  const dateLabel = input.date ?? 'unknown date';
  const subject = `[Buffer health] GBP image check failed — ${dateLabel}`;

  const issueList =
    input.issues.length > 0
      ? `<ul style="margin:0 0 16px;padding-left:20px;line-height:1.6;font-size:13px;">
           ${input.issues
             .slice(0, 10)
             .map(
               (issue) =>
                 `<li>${escapeHtml(String(issue.slug ?? issue.postId))}: ${escapeHtml(String(issue.issue ?? 'unknown'))}</li>`,
             )
             .join('')}
         </ul>`
      : '';

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:640px;">
      <h2 style="margin:0 0 12px;">Buffer GBP health check failed</h2>
      <p style="margin:0 0 16px;line-height:1.5;">
        Weekly Google Business scheduled-image verification found
        <strong>${escapeHtml(String(input.issueCount))}</strong> issue(s) for
        <strong>${escapeHtml(dateLabel)}</strong>.
      </p>
      ${issueList}
      <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">
        Run <code>npm run buffer:verify-scheduled-gbp</code> and
        <code>npm run buffer:repair-gbp</code>. See <code>docs/buffer-ops.md</code>.
      </p>
    </div>
  `;

  const client = getResend();
  if (!client) {
    console.error('[buffer-health email]', subject, input.issueCount);
    return false;
  }

  try {
    await client.emails.send({ from: FROM_EMAIL, to, subject, html });
    return true;
  } catch (err) {
    console.error('[buffer-health email]', err);
    return false;
  }
}

export async function sendTrafficDigestEmail(input: TrafficDigestEmailInput): Promise<boolean> {
  const to = input.adminEmail?.trim() || NOTIFY_EMAIL;
  const dateLabel = input.date ?? new Date().toISOString().slice(0, 10);
  const subject = `[Traffic digest] Network health — ${dateLabel}`;

  const crossDomainHtml =
    input.crossDomainIssues.length > 0
      ? `<ul style="margin:0 0 16px;padding-left:20px;font-size:13px;line-height:1.6;">
           ${input.crossDomainIssues.slice(0, 8).map((i) => `<li>${escapeHtml(i)}</li>`).join('')}
         </ul>`
      : '<p style="margin:0 0 16px;color:#059669;">Cross-domain link check passed.</p>';

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:640px;">
      <h2 style="margin:0 0 12px;">Weekly network traffic digest</h2>
      <p style="margin:0 0 16px;line-height:1.5;">Summary for <strong>${escapeHtml(dateLabel)}</strong>.</p>
      <p style="margin:0 0 8px;"><strong>Buffer GBP:</strong> ${input.gbpOk ? 'OK' : `${input.gbpIssueCount} issue(s)`}${input.scheduledCount != null ? ` · ${input.scheduledCount} posts scheduled today` : ''}</p>
      <p style="margin:0 0 8px;"><strong>Cross-domain links:</strong> ${input.crossDomainOk ? 'OK' : `${input.crossDomainIssues.length} issue(s)`}</p>
      ${crossDomainHtml}
      <p style="margin:0;color:#64748b;font-size:12px;line-height:1.5;">
        Run <code>npm run audit:cross-domain-links</code> and <code>npm run buffer:verify-scheduled-gbp</code>.
      </p>
    </div>
  `;

  const client = getResend();
  if (!client) {
    console.warn('[traffic-digest email]', subject);
    return false;
  }

  try {
    await client.emails.send({ from: FROM_EMAIL, to, subject, html });
    return true;
  } catch (err) {
    console.error('[traffic-digest email]', err);
    return false;
  }
}
