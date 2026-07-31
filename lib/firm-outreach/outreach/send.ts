import { isRetryableProviderError } from '@robertcashman/firm-outreach-core';
import { SITE_URL } from '@/lib/seo-layer/config';
import { COMMUNITY_EMAIL } from '@/lib/site-navigation';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '../campaign-scope';
import { loadBrochureAttachment } from '../brochure/load-attachment';
import { getEmailProvider } from '../email-provider';
import {
  DEFAULT_PSA_FROM_FALLBACK,
  isDomainNotVerifiedError,
  resolveFromAddressForCampaign,
  resolveOutreachFromAddress,
  fetchResendVerifiedDomains,
  repukFromAddress,
} from './from-address';
import { buildOutreachEmailHtml, subjectForStep } from './templates';
import { issueUnsubscribeToken } from './unsubscribe-token';
import type { FirmProspect } from '../types';

function unsubscribeBaseUrl(prospect: FirmProspect): string {
  return prospect.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID
    ? 'https://www.policestationagent.com'
    : SITE_URL;
}

async function resolveInitialFrom(prospect: FirmProspect): Promise<string> {
  const resolved = await resolveOutreachFromAddress(prospect.campaignId);
  return resolved.from;
}

async function verifiedFallbackFrom(prospect: FirmProspect): Promise<string> {
  const verified = await fetchResendVerifiedDomains();
  if (prospect.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID) {
    return resolveFromAddressForCampaign(prospect.campaignId, verified).from;
  }
  return repukFromAddress();
}

export async function sendOutreachEmail(opts: {
  prospect: FirmProspect;
  step: number;
  dryRun?: boolean;
}): Promise<{
  ok: boolean;
  messageId?: string;
  subject: string;
  error?: string;
  statusCode?: number;
  retryable?: boolean;
}> {
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

  const dryRunEnv = process.env.FIRM_OUTREACH_DRY_RUN?.trim().toLowerCase();
  const envDryRun = dryRunEnv !== undefined && ['1', 'true', 'yes', 'on'].includes(dryRunEnv);
  if (opts.dryRun || envDryRun) {
    console.info('[firm-outreach dry-run]', email, subject);
    return { ok: true, subject, messageId: 'dry-run' };
  }

  const provider = getEmailProvider();
  const config = await provider.validateConfiguration();
  if (!config.configured) {
    console.info('[firm-outreach — no RESEND_API_KEY]', email, subject);
    return { ok: false, subject, error: 'no_resend', retryable: false, statusCode: 401 };
  }

  const attachments =
    opts.prospect.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID && opts.step === 0
      ? (() => {
          const brochure = loadBrochureAttachment();
          return brochure ? [{ filename: brochure.filename, content: brochure.content }] : undefined;
        })()
      : undefined;

  let from = await resolveInitialFrom(opts.prospect);
  let retried = false;

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await provider.send({
      from,
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
    if (result.ok) {
      return { ok: true, messageId: result.providerMessageId, subject };
    }
    const msg = result.error ?? 'provider_error';
    if (!retried && isDomainNotVerifiedError(msg)) {
      const fallback =
        opts.prospect.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID
          ? DEFAULT_PSA_FROM_FALLBACK
          : await verifiedFallbackFrom(opts.prospect);
      if (fallback !== from) {
        console.warn(`[firm-outreach] Resend domain error for ${from}; retrying with ${fallback}`);
        from = fallback;
        retried = true;
        continue;
      }
    }
    return {
      ok: false,
      subject,
      error: msg,
      statusCode: result.statusCode,
      retryable: result.retryable ?? isRetryableProviderError(msg, result.statusCode),
    };
  }

  return { ok: false, subject, error: 'send_exhausted_retries', retryable: true };
}
