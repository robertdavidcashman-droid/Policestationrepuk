import { Resend } from 'resend';
import { SITE_URL } from '@/lib/seo-layer/config';
import { COMMUNITY_EMAIL } from '@/lib/site-navigation';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '../campaign-scope';
import { loadBrochureAttachment } from '../brochure/load-attachment';
import { buildOutreachEmailHtml, subjectForStep } from './templates';
import { issueUnsubscribeToken } from './unsubscribe-token';
import type { FirmProspect } from '../types';

const FROM_EMAIL =
  process.env.FIRM_OUTREACH_FROM_EMAIL?.trim() ||
  'PoliceStationRepUK <noreply@policestationrepuk.org>';

const PSA_FROM_EMAIL =
  process.env.FIRM_OUTREACH_PSA_FROM_EMAIL?.trim() ||
  'Police Station Agent <noreply@policestationagent.com>';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

function fromEmailForProspect(prospect: FirmProspect): string {
  return prospect.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID ? PSA_FROM_EMAIL : FROM_EMAIL;
}

function unsubscribeBaseUrl(prospect: FirmProspect): string {
  return prospect.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID
    ? 'https://www.policestationagent.com'
    : SITE_URL;
}

export async function sendOutreachEmail(opts: {
  prospect: FirmProspect;
  step: number;
  dryRun?: boolean;
}): Promise<{ ok: boolean; messageId?: string; subject: string; error?: string }> {
  const email = opts.prospect.email?.trim();
  if (!email) return { ok: false, subject: '', error: 'no_email' };

  const subject = subjectForStep(opts.prospect, opts.step);
  const token = issueUnsubscribeToken(email);
  const unsubscribeUrl = `${unsubscribeBaseUrl(opts.prospect)}/outreach/unsubscribe/${encodeURIComponent(token)}`;
  const html = buildOutreachEmailHtml({
    prospect: opts.prospect,
    step: opts.step,
    unsubscribeUrl,
  });

  if (opts.dryRun || process.env.FIRM_OUTREACH_DRY_RUN === 'true') {
    console.info('[firm-outreach dry-run]', email, subject);
    return { ok: true, subject, messageId: 'dry-run' };
  }

  const client = getResend();
  if (!client) {
    console.info('[firm-outreach — no RESEND_API_KEY]', email, subject);
    return { ok: false, subject, error: 'no_resend' };
  }

  const attachments =
    opts.prospect.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID && opts.step === 0
      ? (() => {
          const brochure = loadBrochureAttachment();
          return brochure ? [{ filename: brochure.filename, content: brochure.content }] : undefined;
        })()
      : undefined;

  try {
    const result = await client.emails.send({
      from: fromEmailForProspect(opts.prospect),
      to: email,
      replyTo: COMMUNITY_EMAIL,
      subject,
      html,
      attachments,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:${COMMUNITY_EMAIL}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    if (result.error) {
      const msg =
        typeof result.error === 'object' && result.error && 'message' in result.error
          ? String((result.error as { message: string }).message)
          : String(result.error);
      return { ok: false, subject, error: msg };
    }
    const messageId = result.data?.id ? String(result.data.id) : undefined;
    if (!messageId) {
      return { ok: false, subject, error: 'no_message_id_from_resend' };
    }
    return { ok: true, messageId, subject };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, subject, error: msg };
  }
}
