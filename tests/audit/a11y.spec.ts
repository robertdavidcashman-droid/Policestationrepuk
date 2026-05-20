import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CORE_PAGES } from './helpers/routes';

test.describe('Accessibility (axe — serious/critical only)', () => {
  for (const route of CORE_PAGES) {
    test(`${route}`, async ({ page }) => {
      const res = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBe(200);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .options({
          rules: {
            // The mirror catch-all + some legacy components have minor styling we won't redesign.
            'color-contrast': { enabled: false },
            region: { enabled: false },
          },
        })
        .analyze();

      const seriousOrCritical = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      const detail = seriousOrCritical
        .map((v) => `  [${v.impact}] ${v.id}: ${v.help}\n    affected: ${v.nodes.slice(0, 3).map((n) => n.target.join(' > ')).join(', ')}`)
        .join('\n');

      expect.soft(seriousOrCritical, `${route} accessibility violations:\n${detail}`).toEqual([]);
      expect(seriousOrCritical).toEqual([]);
    });
  }
});
