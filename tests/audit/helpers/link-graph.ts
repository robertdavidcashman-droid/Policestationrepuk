import type { APIRequestContext, Page } from '@playwright/test';

export interface LinkRecord {
  source: string;
  anchor: string;
  href: string;
  resolved: string;
  isInternal: boolean;
}

export interface CrawlEntry {
  url: string;
  status: number | null;
  redirectedTo: string | null;
  isInternal: boolean;
  fromSources: string[];
}

/**
 * Normalise a URL for the audit:
 *  - strips utm_* / fbclid / gclid tracking params
 *  - strips hash fragment
 *  - lowercases host
 *  - keeps casing of pathname (we care about /Resources vs /resources)
 */
export function normaliseUrl(raw: string, base: string): string | null {
  try {
    const u = new URL(raw, base);
    u.hash = '';
    const toDelete: string[] = [];
    u.searchParams.forEach((_v, k) => {
      if (/^(utm_|fbclid$|gclid$|mc_)/i.test(k)) toDelete.push(k);
    });
    for (const k of toDelete) u.searchParams.delete(k);
    u.hostname = u.hostname.toLowerCase();
    if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.replace(/\/+$/, '');
    }
    return u.toString();
  } catch {
    return null;
  }
}

export function isInternalUrl(url: string, baseUrl: string): boolean {
  try {
    const u = new URL(url, baseUrl);
    const b = new URL(baseUrl);
    return u.host === b.host;
  } catch {
    return false;
  }
}

export async function collectLinks(page: Page, source: string, baseUrl: string): Promise<LinkRecord[]> {
  const links = await page
    .locator('a[href]')
    .evaluateAll((nodes) =>
      nodes.map((el) => ({
        href: (el as HTMLAnchorElement).getAttribute('href') || '',
        anchor: ((el as HTMLAnchorElement).innerText || (el as HTMLAnchorElement).getAttribute('aria-label') || '').trim().slice(0, 120),
      })),
    )
    .catch(() => []);

  const out: LinkRecord[] = [];
  for (const { href, anchor } of links) {
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    const resolved = normaliseUrl(href, source);
    if (!resolved) continue;
    out.push({
      source,
      anchor,
      href,
      resolved,
      isInternal: isInternalUrl(resolved, baseUrl),
    });
  }
  return out;
}

export async function fetchStatus(request: APIRequestContext, url: string, attempts = 2): Promise<{ status: number | null; redirectedTo: string | null }> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await request.get(url, { maxRedirects: 0, timeout: 15_000, failOnStatusCode: false });
      const status = res.status();
      if (status >= 300 && status < 400) {
        const location = res.headers()['location'] ?? null;
        return { status, redirectedTo: location };
      }
      return { status, redirectedTo: null };
    } catch {
      if (i === attempts - 1) return { status: null, redirectedTo: null };
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  return { status: null, redirectedTo: null };
}
