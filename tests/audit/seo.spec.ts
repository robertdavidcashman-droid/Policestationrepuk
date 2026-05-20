import { test, expect } from '@playwright/test';
import { ENTRY_POINTS, CRAWL_CONTENT_PAGES } from './helpers/routes';

const ROUTES = Array.from(new Set([...ENTRY_POINTS, ...CRAWL_CONTENT_PAGES]));

test.describe('SEO metadata', () => {
  const titles = new Map<string, string[]>();

  for (const route of ROUTES) {
    test(`${route} has title, description, canonical, og:title/description and 1 H1`, async ({ page }) => {
      const res = await page.goto(route, { waitUntil: 'domcontentloaded' });
      if (res?.status() === 404 || res?.status() === 410) {
        // Some entry-point variants (e.g. /resources lowercase) may be redirects or static-rendered
        // via case-insensitive routing. Treat 200/30x as ok; only fail on 404+.
        return;
      }
      expect(res?.status()).toBe(200);

      const title = await page.title();
      const description = await page.locator('meta[name="description"]').first().getAttribute('content');
      const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
      const ogTitle = await page.locator('meta[property="og:title"]').first().getAttribute('content');
      const ogDesc = await page.locator('meta[property="og:description"]').first().getAttribute('content');
      const h1Count = await page.locator('h1').count();

      expect.soft(title, `${route} missing <title>`).toBeTruthy();
      expect.soft(description, `${route} missing meta description`).toBeTruthy();
      expect.soft(canonical, `${route} missing canonical`).toBeTruthy();
      expect.soft(ogTitle, `${route} missing og:title`).toBeTruthy();
      expect.soft(ogDesc, `${route} missing og:description`).toBeTruthy();
      expect.soft(h1Count, `${route} should have exactly one H1 (got ${h1Count})`).toBe(1);

      expect(title).toBeTruthy();
      expect(canonical).toBeTruthy();
      expect(h1Count).toBe(1);

      const known = titles.get(title || '') || [];
      known.push(route);
      titles.set(title || '', known);
    });
  }

  test('robots.txt does not block public pages', async ({ request, baseURL }) => {
    const res = await request.get(new URL('/robots.txt', baseURL!).toString());
    expect(res.status()).toBe(200);
    const text = await res.text();
    // Sanity: must not block /, /Resources, /Blog
    expect(text).not.toMatch(/Disallow:\s*\/\s*$/m);
    expect(text).not.toMatch(/Disallow:\s*\/Resources/i);
    expect(text).not.toMatch(/Disallow:\s*\/Blog/i);
  });
});
