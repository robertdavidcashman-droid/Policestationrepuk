import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Ask AI contrast regression', () => {
  for (const route of ['/About', '/links']) {
    test(`${route} floating Ask AI meets contrast on serious/critical axe rules`, async ({ page }) => {
      const res = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBe(200);

      const askAi = page.getByRole('button', { name: /open ai assistant/i });
      await expect(askAi).toBeVisible();

      const results = await new AxeBuilder({ page })
        .include('[aria-label="Open AI assistant"]')
        .withRules(['color-contrast'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});

test.describe('Analytics-free local production mode', () => {
  test('homepage does not request Vercel analytics scripts', async ({ page }) => {
    const vercelAnalytics: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (/_vercel\/(speed-insights|insights)/i.test(url)) {
        vercelAnalytics.push(url);
      }
    });

    const res = await page.goto('/', { waitUntil: 'networkidle' });
    expect(res?.status()).toBe(200);
    expect(vercelAnalytics).toEqual([]);
  });
});
