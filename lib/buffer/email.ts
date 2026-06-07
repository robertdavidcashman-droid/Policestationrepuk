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
