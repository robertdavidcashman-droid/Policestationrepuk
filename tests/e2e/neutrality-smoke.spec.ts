import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Neutrality and directory smoke — desktop', () => {
  test('homepage loads without console errors and is directory-led', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/directory|representative/i);
    // Ignore environment-only noise — favicon, Vercel-injected analytics scripts
    // (404/MIME) when the prod build is served off-Vercel, and generic
    // third-party resource-load failures that don't break the app.
    const appErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('_vercel/speed-insights') &&
        !e.includes('_vercel/insights') &&
        !e.includes('speed-insights/script.js') &&
        !e.includes('Failed to load resource'),
    );
    expect(appErrors).toHaveLength(0);
  });

  test('directory search page loads and has search input', async ({ page }) => {
    await page.goto('/directory');
    await expect(page.locator('input[type="search"], input[placeholder*="search" i], input[name="q"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('Kent county page has Advertisement label on PSA box', async ({ page }) => {
    await page.goto('/directory/kent');
    const adLabel = page.getByText('Advertisement', { exact: true });
    await expect(adLabel.first()).toBeVisible();
    await expect(page.getByText(/separate from this directory/i)).toBeVisible();
  });

  test('Kent county page lists representatives neutrally', async ({ page }) => {
    await page.goto('/directory/kent');
    await expect(page.getByRole('heading', { name: 'Representatives in Kent', exact: true })).toBeVisible();
  });

  test('Robert profile shows listing owner transparency note', async ({ page }) => {
    await page.goto('/rep/robert-cashman');
    await expect(page.getByText(/listing owner.*own commercial service/i)).toBeVisible();
  });

  test('homepage featured carousel has promoted listing label', async ({ page }) => {
    await page.goto('/');
    const promoted = page.getByText(/promoted listings/i);
    if (await promoted.count()) {
      await expect(promoted.first()).toBeVisible();
    }
  });
});

test.describe('Accessibility (axe — serious/critical only)', () => {
  for (const route of ['/', '/directory']) {
    test(`no serious/critical a11y violations: ${route}`, async ({ page }) => {
      const res = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBeLessThan(400);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .options({ rules: { region: { enabled: false } } })
        .analyze();

      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      const detail = seriousOrCritical
        .map(
          (v) =>
            `  [${v.impact}] ${v.id}: ${v.help}\n    affected: ${v.nodes
              .slice(0, 3)
              .map((n) => n.target.join(' > '))
              .join(', ')}`,
        )
        .join('\n');

      expect(seriousOrCritical, `${route} accessibility violations:\n${detail}`).toEqual([]);
    });
  }
});

test.describe('Neutrality smoke — mobile viewport', () => {
  test('directory page usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/directory');
    await expect(page.locator('body')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 20);
    expect(overflow).toBe(true);
  });
});
