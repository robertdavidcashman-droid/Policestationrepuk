import { test, expect } from '@playwright/test';
import { CORE_PAGES, VIEWPORTS } from './helpers/routes';

test.describe('Responsive layout sanity', () => {
  for (const vp of VIEWPORTS) {
    for (const route of CORE_PAGES) {
      test(`${route} @ ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const res = await page.goto(route, { waitUntil: 'domcontentloaded' });
        expect(res?.status()).toBe(200);

        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.body.scrollWidth,
          innerWidth: window.innerWidth,
        }));

        expect.soft(
          scrollWidth - innerWidth,
          `${route} @ ${vp.name}: horizontal overflow ${scrollWidth - innerWidth}px (scrollWidth=${scrollWidth}, innerWidth=${innerWidth})`,
        ).toBeLessThanOrEqual(8);

        const h1 = page.locator('h1').first();
        await expect(h1).toBeVisible();
      });
    }
  }
});
