/**
 * Pre-flight Resend probes for both outreach brands/sites:
 * - policestationrepuk.com / .org → whatsapp_invite_v1
 * - policestationagent.com → agent_cover_kent_v1
 * Sends one operator-only test email per campaign so we confirm
 * from-address resolution before flushing live firm mail.
 */
import { COMMUNITY_EMAIL } from '@/lib/site-navigation';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '../campaign-scope';
import { getEmailProvider } from '../email-provider';
import { FIRM_OUTREACH_CAMPAIGN_ID } from '../site-config';
import {
  DEFAULT_PSA_FROM_FALLBACK,
  DEFAULT_PSA_FROM_PREFERRED,
  fetchResendVerifiedDomains,
  parseFromAddressDomain,
  resolveOutreachFromAddress,
  VERIFIED_FALLBACK_DOMAIN,
} from './from-address';
import { outreachNotifyEmail } from './notify-recipient';

export interface CampaignProbeResult {
  campaignId: string;
  site: string;
  preferredFrom: string;
  resolvedFrom: string;
  resolvedDomain: string;
  preferredDomainVerified: boolean;
  usedFallback: boolean;
  to: string;
  ok: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

export interface OutreachProbeResult {
  ok: boolean;
  verifiedResendDomains: string[];
  sites: {
    policestationrepuk: { com: string; org: string; reachable: boolean };
    policestationagent: { apex: string; www: string; reachable: boolean };
  };
  probes: CampaignProbeResult[];
  blockers: string[];
}

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    return res.ok;
  } catch {
    return false;
  }
}

function probeHtml(opts: {
  campaignId: string;
  site: string;
  from: string;
  domain: string;
  usedFallback: boolean;
}): string {
  return `<!doctype html><html><body style="font-family:Georgia,serif;line-height:1.5;color:#111">
  <p><strong>Firm outreach send probe</strong></p>
  <p>Campaign: <code>${opts.campaignId}</code><br/>
  Site: <code>${opts.site}</code><br/>
  From: <code>${opts.from}</code><br/>
  Domain: <code>${opts.domain}</code><br/>
  Fallback used: <code>${opts.usedFallback ? 'yes' : 'no'}</code></p>
  <p>If you received this, Resend accepted mail for this campaign path.</p>
  </body></html>`;
}

export async function runOutreachSendProbes(opts?: {
  to?: string;
  /** When true, resolve/check domains but do not call Resend. */
  dryRun?: boolean;
}): Promise<OutreachProbeResult> {
  const to = (opts?.to ?? outreachNotifyEmail()).trim().toLowerCase();
  const verified = await fetchResendVerifiedDomains();
  const verifiedList = [...verified].sort();

  const [repukCom, repukOrg, psaApex, psaWww] = await Promise.all([
    headOk('https://policestationrepuk.com'),
    headOk('https://policestationrepuk.org'),
    headOk('https://policestationagent.com'),
    headOk('https://www.policestationagent.com'),
  ]);

  const provider = getEmailProvider();
  const config = await provider.validateConfiguration();
  const blockers: string[] = [];
  if (!config.configured) blockers.push('RESEND_API_KEY missing');
  if (!to) blockers.push('no probe recipient');
  if (!verified.has(VERIFIED_FALLBACK_DOMAIN)) {
    blockers.push(`${VERIFIED_FALLBACK_DOMAIN} not verified on Resend`);
  }

  const campaigns: Array<{
    campaignId: string;
    site: string;
    preferredFrom: string;
  }> = [
    {
      campaignId: FIRM_OUTREACH_CAMPAIGN_ID,
      site: 'policestationrepuk.com → policestationrepuk.org',
      preferredFrom:
        process.env.FIRM_OUTREACH_FROM_EMAIL?.trim() ||
        `PoliceStationRepUK <noreply@${VERIFIED_FALLBACK_DOMAIN}>`,
    },
    {
      campaignId: AGENT_COVER_KENT_CAMPAIGN_ID,
      site: 'policestationagent.com',
      preferredFrom:
        process.env.FIRM_OUTREACH_PSA_FROM_EMAIL?.trim() || DEFAULT_PSA_FROM_PREFERRED,
    },
  ];

  const probes: CampaignProbeResult[] = [];

  for (const c of campaigns) {
    const resolved = await resolveOutreachFromAddress(c.campaignId);
    const preferredDomain = parseFromAddressDomain(c.preferredFrom) ?? '';
    const preferredDomainVerified = preferredDomain ? verified.has(preferredDomain) : false;

    const base: CampaignProbeResult = {
      campaignId: c.campaignId,
      site: c.site,
      preferredFrom: c.preferredFrom,
      resolvedFrom: resolved.from,
      resolvedDomain: resolved.domain,
      preferredDomainVerified,
      usedFallback: resolved.usedFallback,
      to,
      ok: false,
    };

    if (blockers.length > 0) {
      probes.push({ ...base, skipped: true, reason: blockers.join('; '), error: blockers[0] });
      continue;
    }

    if (opts?.dryRun) {
      probes.push({ ...base, ok: true, skipped: true, reason: 'dry_run', messageId: 'dry-run' });
      continue;
    }

    const result = await provider.send({
      from: resolved.from,
      to,
      replyTo: COMMUNITY_EMAIL,
      subject: `[probe] ${c.site} / ${c.campaignId} send check`,
      html: probeHtml({
        campaignId: c.campaignId,
        site: c.site,
        from: resolved.from,
        domain: resolved.domain,
        usedFallback: resolved.usedFallback,
      }),
      headers: {
        'X-Firm-Outreach-Probe': c.campaignId,
        'X-Firm-Outreach-Probe-Site': c.site,
      },
    });

    if (result.ok) {
      probes.push({ ...base, ok: true, messageId: result.providerMessageId });
      continue;
    }

    // PSA: match live send.ts — retry once with DEFAULT_PSA_FROM_FALLBACK
    // (not resolveFromAddressForCampaign, which can re-pick the preferred
    // domain when Resend still lists it as verified).
    if (
      c.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID &&
      resolved.from !== DEFAULT_PSA_FROM_FALLBACK
    ) {
      const fallbackFrom = DEFAULT_PSA_FROM_FALLBACK;
      const fallbackDomain =
        parseFromAddressDomain(fallbackFrom) ?? VERIFIED_FALLBACK_DOMAIN;
      const retry = await provider.send({
        from: fallbackFrom,
        to,
        replyTo: COMMUNITY_EMAIL,
        subject: `[probe] ${c.campaignId} send check (fallback)`,
        html: probeHtml({
          campaignId: c.campaignId,
          site: c.site,
          from: fallbackFrom,
          domain: fallbackDomain,
          usedFallback: true,
        }),
        headers: {
          'X-Firm-Outreach-Probe': `${c.campaignId}:fallback`,
        },
      });
      if (retry.ok) {
        probes.push({
          ...base,
          ok: true,
          resolvedFrom: fallbackFrom,
          resolvedDomain: fallbackDomain,
          usedFallback: true,
          messageId: retry.providerMessageId,
        });
        continue;
      }
      probes.push({
        ...base,
        ok: false,
        error: retry.error ?? result.error ?? 'provider_error',
      });
      continue;
    }

    probes.push({ ...base, ok: false, error: result.error ?? 'provider_error' });
  }

  const ok =
    blockers.length === 0 &&
    probes.length === 2 &&
    probes.every((p) => p.ok) &&
    (repukCom || repukOrg) &&
    (psaApex || psaWww);

  return {
    ok,
    verifiedResendDomains: verifiedList,
    sites: {
      policestationrepuk: {
        com: 'https://policestationrepuk.com',
        org: 'https://policestationrepuk.org',
        reachable: Boolean(repukCom || repukOrg),
      },
      policestationagent: {
        apex: 'https://policestationagent.com',
        www: 'https://www.policestationagent.com',
        reachable: Boolean(psaApex || psaWww),
      },
    },
    probes,
    blockers,
  };
}
