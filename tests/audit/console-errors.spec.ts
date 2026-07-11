import { test, expect } from '@playwright/test';
import { CORE_PAGES } from './helpers/routes';

const IGNORED_CONSOLE_PATTERNS: RegExp[] = [
  /Failed to load resource:.*favicon/i,
  /Failed to load resource:.*_vercel\/(speed-insights|insights)/i,
  /Refused to execute script from .*_vercel\/(speed-insights|insights)/i,
  /Tracking Prevention/i,
  /Stripe\.js/i,
  /HMR/i,
];

const IGNORED_NETWORK_PATTERNS: RegExp[] = [
  /\.well-known\/(appspecific|microsoft-identity)/i,
  /favicon\.ico/i,
  /\/api\/featured\/grandfather/i,
  /\/_vercel\/(speed-insights|insights)\//i,
];

test.describe('Console, page error and network sanity', () => {
  for (const route of CORE_PAGES) {
    test(`${route} has no console errors, page errors, or 4xx/5xx asset requests`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const failedRequests: Array<{ url: string; status: number | string }> = [];

      page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        if (IGNORED_CONSOLE_PATTERNS.some((re) => re.test(text))) return;
        consoleErrors.push(text);
      });

      page.on('pageerror', (err) => {
        pageErrors.push(err.message);
      });

      page.on('response', (response) => {
        const url = response.url();
        if (IGNORED_NETWORK_PATTERNS.some((re) => re.test(url))) return;
        const status = response.status();
        if (status >= 400) failedRequests.push({ url, status });
      });

      page.on('requestfailed', (req) => {
        const url = req.url();
        if (IGNORED_NETWORK_PATTERNS.some((re) => re.test(url))) return;
        failedRequests.push({ url, status: req.failure()?.errorText || 'failed' });
      });

      const res = await page.goto(route, { waitUntil: 'networkidle', timeout: 30_000 });
      expect(res?.status()).toBe(200);

      expect.soft(consoleErrors, `${route} console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
      expect.soft(pageErrors, `${route} page errors:\n${pageErrors.join('\n')}`).toEqual([]);
      expect.soft(
        failedRequests,
        `${route} failed requests:\n${failedRequests.map((f) => `  ${f.status} ${f.url}`).join('\n')}`,
      ).toEqual([]);

      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(failedRequests.filter((f) => typeof f.status === 'number' && f.status >= 500)).toEqual([]);
    });
  }
});
