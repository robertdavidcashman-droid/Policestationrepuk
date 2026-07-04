import { AGENT_COVER_KENT_CAMPAIGN_ID } from '../campaign-scope';
import { FIRM_OUTREACH_CAMPAIGN_ID } from '../site-config';

export const VERIFIED_FALLBACK_DOMAIN = 'policestationrepuk.org';

export const DEFAULT_REPUK_FROM = 'PoliceStationRepUK <noreply@policestationrepuk.org>';
export const DEFAULT_PSA_FROM_PREFERRED = 'Police Station Agent <noreply@policestationagent.com>';
export const DEFAULT_PSA_FROM_FALLBACK = 'Police Station Agent <noreply@policestationrepuk.org>';

const VERIFIED_DOMAINS_CACHE_MS = 5 * 60 * 1000;

let verifiedDomainsCache: { at: number; domains: Set<string> } | null = null;

export function parseFromAddressDomain(from: string): string | null {
  const match = from.match(/<([^>]+)>/);
  const email = (match?.[1] ?? from).trim();
  const at = email.lastIndexOf('@');
  if (at < 0) return null;
  return email.slice(at + 1).toLowerCase();
}

export function isDomainNotVerifiedError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes('domain is not verified') || m.includes('domain not verified');
}

export function repukFromAddress(): string {
  return process.env.FIRM_OUTREACH_FROM_EMAIL?.trim() || DEFAULT_REPUK_FROM;
}

export function psaPreferredFromAddress(): string {
  return process.env.FIRM_OUTREACH_PSA_FROM_EMAIL?.trim() || DEFAULT_PSA_FROM_PREFERRED;
}

export function clearVerifiedDomainsCache(): void {
  verifiedDomainsCache = null;
}

export type ResendDomainRecord = { name: string; status: string };

export type ResendDomainLister = () => Promise<{
  data?: ResendDomainRecord[] | { data?: ResendDomainRecord[] } | null;
}>;

function normalizeDomainRecords(
  data: ResendDomainRecord[] | { data?: ResendDomainRecord[] } | null | undefined,
): ResendDomainRecord[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
}

export async function fetchResendVerifiedDomains(
  listDomains?: ResendDomainLister,
): Promise<Set<string>> {
  if (verifiedDomainsCache && Date.now() - verifiedDomainsCache.at < VERIFIED_DOMAINS_CACHE_MS) {
    return verifiedDomainsCache.domains;
  }

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return new Set([VERIFIED_FALLBACK_DOMAIN]);
  }

  const list =
    listDomains ??
    (async () => {
      const { Resend } = await import('resend');
      return new Resend(key).domains.list();
    });

  try {
    const result = await list();
    const domains = new Set<string>();
    for (const d of normalizeDomainRecords(result.data)) {
      if (d.status === 'verified') domains.add(d.name.toLowerCase());
    }
    verifiedDomainsCache = { at: Date.now(), domains };
    return domains;
  } catch (err) {
    console.warn('[firm-outreach] Resend domains.list failed:', err);
    return new Set([VERIFIED_FALLBACK_DOMAIN]);
  }
}

export interface ResolvedFromAddress {
  from: string;
  domain: string;
  campaignId: string;
  usedFallback: boolean;
  preferredFrom?: string;
}

export function resolveFromAddressForCampaign(
  campaignId: string,
  verifiedDomains: Set<string>,
): ResolvedFromAddress {
  if (campaignId === AGENT_COVER_KENT_CAMPAIGN_ID) {
    const preferred = psaPreferredFromAddress();
    const preferredDomain = parseFromAddressDomain(preferred) ?? 'policestationagent.com';
    if (verifiedDomains.has(preferredDomain)) {
      return {
        from: preferred,
        domain: preferredDomain,
        campaignId,
        usedFallback: false,
      };
    }
    const fallback = DEFAULT_PSA_FROM_FALLBACK;
    const fallbackDomain = parseFromAddressDomain(fallback) ?? VERIFIED_FALLBACK_DOMAIN;
    return {
      from: fallback,
      domain: fallbackDomain,
      campaignId,
      usedFallback: true,
      preferredFrom: preferred,
    };
  }

  const from = repukFromAddress();
  const domain = parseFromAddressDomain(from) ?? VERIFIED_FALLBACK_DOMAIN;
  if (!verifiedDomains.has(domain)) {
    const fallbackFrom = DEFAULT_REPUK_FROM;
    const fallbackDomain = parseFromAddressDomain(fallbackFrom) ?? VERIFIED_FALLBACK_DOMAIN;
    return {
      from: fallbackFrom,
      domain: fallbackDomain,
      campaignId: campaignId || FIRM_OUTREACH_CAMPAIGN_ID,
      usedFallback: true,
      preferredFrom: from,
    };
  }
  return {
    from,
    domain,
    campaignId: campaignId || FIRM_OUTREACH_CAMPAIGN_ID,
    usedFallback: false,
  };
}

export async function resolveOutreachFromAddress(campaignId: string): Promise<ResolvedFromAddress> {
  const verified = await fetchResendVerifiedDomains();
  const resolved = resolveFromAddressForCampaign(campaignId, verified);
  if (resolved.usedFallback) {
    console.warn(
      `[firm-outreach] Using verified from-address fallback for ${campaignId}: ${resolved.from}` +
        (resolved.preferredFrom ? ` (preferred ${resolved.preferredFrom} not verified on Resend)` : ''),
    );
  }
  return resolved;
}

export interface CampaignSendHealth {
  campaignId: string;
  from: string;
  domain: string;
  domainVerified: boolean;
  usedFallbackDefault: boolean;
  canSend: boolean;
  blockers: string[];
}

export async function getOutreachSendHealth(): Promise<{
  sendHealthy: boolean;
  sendBlockers: string[];
  campaigns: CampaignSendHealth[];
  resendConfigured: boolean;
  verifiedDomains: string[];
}> {
  const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  const sendBlockers: string[] = [];
  if (!resendConfigured) sendBlockers.push('RESEND_API_KEY missing');

  const verified = await fetchResendVerifiedDomains();
  const verifiedList = [...verified].sort();

  if (!verified.has(VERIFIED_FALLBACK_DOMAIN)) {
    sendBlockers.push(`${VERIFIED_FALLBACK_DOMAIN} not verified in Resend`);
  }

  const campaigns: CampaignSendHealth[] = [];
  for (const campaignId of [FIRM_OUTREACH_CAMPAIGN_ID, AGENT_COVER_KENT_CAMPAIGN_ID]) {
    const resolved = resolveFromAddressForCampaign(campaignId, verified);
    const domainVerified = verified.has(resolved.domain);
    const blockers: string[] = [];
    if (!resendConfigured) blockers.push('resend_not_configured');
    if (!domainVerified) {
      blockers.push(`from_domain_not_verified:${resolved.domain}`);
    }
    if (resolved.usedFallback && resolved.preferredFrom) {
      const preferredDomain = parseFromAddressDomain(resolved.preferredFrom);
      blockers.push(
        `psa_using_repuk_from_until_${preferredDomain ?? 'psa_domain'}_verified`,
      );
    }
    campaigns.push({
      campaignId,
      from: resolved.from,
      domain: resolved.domain,
      domainVerified,
      usedFallbackDefault: resolved.usedFallback,
      canSend: resendConfigured && domainVerified,
      blockers,
    });
  }

  const sendHealthy =
    sendBlockers.length === 0 && campaigns.every((c) => c.canSend);

  return { sendHealthy, sendBlockers, campaigns, resendConfigured, verifiedDomains: verifiedList };
}

export async function assertOutreachSendReady(campaignId: string): Promise<{
  ok: boolean;
  reason?: string;
  from?: string;
}> {
  const health = await getOutreachSendHealth();
  if (!health.resendConfigured) {
    return { ok: false, reason: 'RESEND_API_KEY not configured' };
  }
  const campaign = health.campaigns.find((c) => c.campaignId === campaignId);
  if (!campaign) {
    return { ok: false, reason: `Unknown campaign ${campaignId}` };
  }
  if (!campaign.canSend) {
    return {
      ok: false,
      reason: `Send blocked for ${campaignId}: ${campaign.blockers.join('; ')}`,
    };
  }
  return { ok: true, from: campaign.from };
}
