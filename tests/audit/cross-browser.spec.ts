import { test, expect } from '@playwright/test';
import { CORE_PAGES } from './helpers/routes';

/** Tier-1 routes on WebKit — catches Safari-specific layout regressions. */
const WEBKIT_SMOKE = CORE_PAGES.slice(0, 4);

test.describe('Cross-browser smoke (WebKit)', () => {
  for (const route of WEBKIT_SMOKE) {
    test(`${route} renders`, async ({ page }) => {
      const res = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBe(200);
      await expect(page.locator('main#main-content')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
    });
  }
});
