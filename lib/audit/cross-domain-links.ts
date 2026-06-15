/**
 * Validate reciprocal cross-links and UTM params across the Defence Legal network.
 */

const SITES = [
  {
    id: 'policestationrepuk',
    homepage: 'https://policestationrepuk.org/',
    ownHosts: ['policestationrepuk.org', 'policestationrepuk.com'],
    mustInclude: ['custodynote.com', 'psrtrain.com', 'policestationagent.com'],
  },
  {
    id: 'psrtrain',
    homepage: 'https://www.psrtrain.com/',
    ownHosts: ['psrtrain.com'],
    mustInclude: ['policestationrepuk.org', 'custodynote.com'],
  },
  {
    id: 'custodynote',
    homepage: 'https://custodynote.com/',
    ownHosts: ['custodynote.com'],
    mustInclude: ['policestationrepuk.org', 'psrtrain.com'],
  },
  {
    id: 'policestationagent',
    homepage: 'https://www.policestationagent.com/',
    ownHosts: ['policestationagent.com'],
    mustInclude: ['policestationrepuk.org', 'custodynote.com', 'psrtrain.com'],
  },
] as const;

const PARTNER_HOSTS = new Set([
  'custodynote.com',
  'psrtrain.com',
  'policestationagent.com',
  'policestationrepuk.org',
  'policestationrepuk.com',
]);

export interface CrossDomainLinksAuditResult {
  ok: boolean;
  issueCount: number;
  issues: string[];
}

function decodeHref(href: string): string {
  return href.replace(/&amp;/g, '&');
}

function hostOf(href: string): string | null {
  try {
    return new URL(decodeHref(href)).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function isOwnHost(siteOwnHosts: readonly string[], href: string): boolean {
  const host = hostOf(href);
  if (!host) return false;
  return siteOwnHosts.some((own) => host === own.replace(/^www\./, ''));
}

function isOutboundPartnerLink(siteOwnHosts: readonly string[], href: string): boolean {
  const host = hostOf(href);
  if (!host || !PARTNER_HOSTS.has(host)) return false;
  return !isOwnHost(siteOwnHosts, href);
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'DefenceLegal-CrossDomainAudit/1.0' },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

export async function auditCrossDomainLinks(): Promise<CrossDomainLinksAuditResult> {
  const issues: string[] = [];

  for (const site of SITES) {
    let html: string;
    try {
      html = await fetchHtml(site.homepage);
    } catch (err) {
      issues.push(`${site.id}: failed to fetch homepage — ${err instanceof Error ? err.message : err}`);
      continue;
    }

    const lower = html.toLowerCase();
    for (const needle of site.mustInclude) {
      if (!lower.includes(needle)) {
        issues.push(`${site.id}: homepage missing link/reference to ${needle}`);
      }
    }

    const partnerLinks = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1]!);
    for (const rawHref of partnerLinks) {
      const href = decodeHref(rawHref);
      if (isOutboundPartnerLink(site.ownHosts, href) && !href.includes('utm_source=')) {
        issues.push(`${site.id}: outbound partner link without utm_source: ${href.slice(0, 120)}`);
      }
    }
  }

  return { ok: issues.length === 0, issueCount: issues.length, issues };
}
