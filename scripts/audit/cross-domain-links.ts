#!/usr/bin/env npx tsx
/**
 * Validate reciprocal cross-links and UTM params across the Defence Legal network.
 * Usage: npm run audit:cross-domain-links
 */
const SITES = [
  {
    id: 'policestationrepuk',
    homepage: 'https://policestationrepuk.org/',
    mustInclude: ['custodynote.com', 'psrtrain.com', 'policestationagent.com'],
  },
  {
    id: 'psrtrain',
    homepage: 'https://www.psrtrain.com/',
    mustInclude: ['policestationrepuk.org', 'custodynote.com'],
  },
  {
    id: 'custodynote',
    homepage: 'https://custodynote.com/',
    mustInclude: ['policestationrepuk.org', 'psrtrain.com'],
  },
  {
    id: 'policestationagent',
    homepage: 'https://www.policestationagent.com/',
    mustInclude: ['policestationrepuk.org', 'custodynote.com', 'psrtrain.com'],
  },
] as const;

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'DefenceLegal-CrossDomainAudit/1.0' },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function main() {
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
    for (const href of partnerLinks) {
      if (
        (href.includes('custodynote.com') ||
          href.includes('psrtrain.com') ||
          href.includes('policestationagent.com') ||
          href.includes('policestationrepuk.org')) &&
        !href.includes('utm_source=')
      ) {
        issues.push(`${site.id}: partner link without utm_source: ${href.slice(0, 120)}`);
      }
    }
  }

  const report = { ok: issues.length === 0, issueCount: issues.length, issues };
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
