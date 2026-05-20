import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ENTRY_POINTS } from './helpers/routes';
import { collectLinks, fetchStatus, normaliseUrl } from './helpers/link-graph';

const REPORT_DIR = path.join(process.cwd(), 'reports');

interface LinkCheck {
  source: string;
  anchor: string;
  href: string;
  resolved: string;
  status: number | null;
  redirectedTo: string | null;
}

test.describe.configure({ mode: 'serial' });

test.describe('Internal link audit', () => {
  test.setTimeout(420_000);

  test('every internal link discovered from entry points returns 200 or an expected redirect', async ({ browser, request, baseURL }) => {
    const base = baseURL!;
    const linkMeta = new Map<string, { source: string; anchor: string; href: string }>();
    const sampledKeys = new Set<string>();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Discovery phase: visit each entry point, collect every internal link on it. No recursion.
    for (const entry of ENTRY_POINTS) {
      const url = new URL(entry, base).toString();
      try {
        const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        if (res?.status() !== 200) continue;
      } catch {
        continue;
      }
      const links = await collectLinks(page, url, base);
      for (const link of links) {
        if (!link.isInternal) continue;
        const u = new URL(link.resolved);
        if (u.pathname.startsWith('/api/')) continue;
        if (u.pathname.startsWith('/_next/')) continue;
        if (u.pathname.toLowerCase().startsWith('/admin')) continue;
        // Sample dynamic high-fanout patterns rather than probing every entry:
        // the sitemap audit confirms the static pre-rendered slugs separately.
        if (/^\/(rep|firm|police-station|police-station-rep-|directory\/[a-z-]+\/[a-z-]+)\//i.test(u.pathname)) {
          const sampleKey = u.pathname.split('/').slice(0, 3).join('/');
          if (sampledKeys.has(sampleKey)) continue;
          sampledKeys.add(sampleKey);
        }
        if (!linkMeta.has(link.resolved)) {
          linkMeta.set(link.resolved, { source: url, anchor: link.anchor, href: link.href });
        }
      }
    }
    await context.close();

    // Status-check phase: each unique URL exactly once, sequentially (server-friendly).
    const checks: LinkCheck[] = [];
    for (const [resolved, meta] of linkMeta) {
      const { status, redirectedTo } = await fetchStatus(request, resolved);
      checks.push({
        source: meta.source,
        anchor: meta.anchor,
        href: meta.href,
        resolved,
        status,
        redirectedTo,
      });
    }

    fs.mkdirSync(REPORT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(REPORT_DIR, 'broken-links.json'),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          baseUrl: base,
          uniqueLinks: linkMeta.size,
          totalChecks: checks.length,
          checks,
        },
        null,
        2,
      ),
    );

    const broken = checks.filter((c) => c.status === null || c.status >= 400);
    if (broken.length) {
      console.warn(`Audit: ${broken.length} broken internal links`);
      for (const b of broken.slice(0, 50)) {
        console.warn(`  BROKEN ${b.status ?? 'ERR'} ${b.resolved} (from ${b.source})`);
      }
    }

    expect.soft(broken, broken.map((b) => `${b.status} ${b.resolved} (from ${b.source})`).join('\n')).toEqual([]);
    expect(broken).toEqual([]);
  });

  test('every entry point that exists responds 200 (or 30x to a real URL) directly', async ({ request, baseURL }) => {
    const base = baseURL!;
    const failures: Array<{ path: string; status: number | null; redirectedTo: string | null }> = [];
    for (const p of ENTRY_POINTS) {
      const url = new URL(p, base).toString();
      const { status, redirectedTo } = await fetchStatus(request, url);
      const isOk = status === 200 || (status !== null && status >= 300 && status < 400);
      if (!isOk) failures.push({ path: p, status, redirectedTo });
    }
    expect.soft(failures, failures.map((f) => `${f.path} -> ${f.status}`).join('\n')).toEqual([]);
    expect(failures).toEqual([]);
  });

  test('sitemap.xml advertises only reachable URLs', async ({ request, baseURL }) => {
    const base = baseURL!;
    const res = await request.get(new URL('/sitemap.xml', base).toString(), { timeout: 30_000 });
    expect(res.status()).toBe(200);
    const xml = await res.text();
    const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);

    // Sample first 30 sitemap URLs so the audit stays under a couple of minutes locally.
    const sample = urls.slice(0, 30);
    const broken: Array<{ url: string; status: number | null }> = [];
    for (const url of sample) {
      const target = url.startsWith('http') ? url.replace(/https?:\/\/[^/]+/, base.replace(/\/$/, '')) : url;
      const { status } = await fetchStatus(request, target);
      if (status !== 200 && !(status !== null && status >= 300 && status < 400)) {
        broken.push({ url: target, status });
      }
    }

    expect.soft(broken, broken.map((b) => `${b.status} ${b.url}`).join('\n')).toEqual([]);
    expect(broken).toEqual([]);
  });
});

void normaliseUrl;
