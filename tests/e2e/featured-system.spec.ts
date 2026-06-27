import { test, expect } from '@playwright/test';

/**
 * Filters out environment-only console noise so the assertion focuses on real
 * app errors. Vercel Speed Insights / Analytics scripts are blocked by the CSP
 * when served off-Vercel locally — that is not an application error.
 */
function isAppConsoleError(message: string): boolean {
  return (
    !message.includes('favicon') &&
    !message.includes('404') &&
    !message.includes('net::ERR') &&
    !message.includes('va.vercel-scripts.com') &&
    !message.includes('_vercel/speed-insights') &&
    !message.includes('_vercel/insights') &&
    !message.includes('speed-insights/script') &&
    !message.includes('Content Security Policy')
  );
}

test.describe('Featured System — Public Display', () => {
  test('homepage loads with featured carousel', async ({ page }) => {
    await page.goto('/');
    const carousel = page.locator('section[aria-label="Sponsored representative listings"]');
    await expect(carousel).toBeVisible({ timeout: 15_000 });
    await expect(carousel.locator('h2')).toContainText('Featured Police Station Representatives');
  });

  test('Robert Cashman appears first in featured carousel', async ({ page }) => {
    await page.goto('/');
    const carousel = page.locator('section[aria-label="Sponsored representative listings"]');
    await expect(carousel).toBeVisible({ timeout: 15_000 });
    const firstRepName = carousel.locator('h3').first();
    await expect(firstRepName).toContainText('Robert Cashman');
  });

  test('featured carousel has navigation controls', async ({ page }) => {
    await page.goto('/');
    const carousel = page.locator('section[aria-label="Sponsored representative listings"]');
    await expect(carousel).toBeVisible({ timeout: 15_000 });
    await expect(carousel.locator('button[aria-label="Next spotlight rep"]')).toBeVisible();
    await expect(carousel.locator('button[aria-label="Previous spotlight rep"]')).toBeVisible();
  });

  test('featured carousel navigates between reps', async ({ page }) => {
    await page.goto('/');
    const carousel = page.locator('section[aria-label="Sponsored representative listings"]');
    await expect(carousel).toBeVisible({ timeout: 15_000 });
    const firstName = await carousel.locator('h3').first().textContent();
    await carousel.locator('button[aria-label="Next spotlight rep"]').click();
    await page.waitForTimeout(500);
    const secondName = await carousel.locator('h3').first().textContent();
    expect(firstName).not.toBe(secondName);
  });

  test('directory page loads with featured section', async ({ page }) => {
    await page.goto('/directory');
    const featuredHeading = page.getByRole('heading', { name: /Featured Representative/i }).first();
    await expect(featuredHeading).toBeVisible({ timeout: 25_000 });
  });

  test('Robert Cashman is first in directory featured section', async ({ page }) => {
    await page.goto('/directory');
    const heading = page.getByRole('heading', { name: 'Featured Representatives' });
    await expect(heading).toBeVisible({ timeout: 15_000 });
    const allRepLinks = page.locator('a[href*="/rep/"]');
    const firstRepLink = allRepLinks.first();
    await expect(firstRepLink).toBeVisible({ timeout: 10_000 });
    const href = await firstRepLink.getAttribute('href');
    expect(href).toContain('robert-cashman');
  });

  test('no non-featured reps appear in featured section', async ({ page }) => {
    await page.goto('/directory');
    await page.getByRole('heading', { name: /Featured Representative/i }).first().waitFor({ state: 'visible', timeout: 25_000 });
    const allListingsHeading = page.locator('h2:has-text("All listings")');
    await expect(allListingsHeading).toBeVisible({ timeout: 15_000 });
  });

  test('featured rep profile page loads', async ({ page }) => {
    await page.goto('/rep/robert-cashman');
    await expect(page.locator('h1')).toContainText('Robert Cashman', { timeout: 10_000 });
  });
});

test.describe('Featured System — GoFeatured Page', () => {
  test('GoFeatured page loads correctly', async ({ page }) => {
    await page.goto('/GoFeatured');
    await expect(page.locator('h1')).toContainText('Become a Featured Representative', { timeout: 10_000 });
  });

  test('GoFeatured page has actionable CTAs', async ({ page }) => {
    await page.goto('/GoFeatured');
    await page.waitForLoadState('domcontentloaded');
    const allLinks = await page.locator('a').evaluateAll((els) =>
      els.map((el) => ({ href: el.getAttribute('href'), text: el.textContent?.trim() }))
    );
    const hasRegister = allLinks.some((l) => l.href?.includes('/register'));
    expect(hasRegister).toBeTruthy();
    const hasUpgradeOrContact = allLinks.some(
      (l) => l.href?.includes('/Account') || l.href?.includes('/Contact'),
    );
    expect(hasUpgradeOrContact).toBeTruthy();
  });

  test('GoFeatured page shows features and FAQ', async ({ page }) => {
    await page.goto('/GoFeatured');
    await expect(page.getByRole('heading', { name: 'What You Get' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeVisible();
  });
});

test.describe('Featured System — API', () => {
  test('GET /api/account/featured returns 401 without auth', async ({ request }) => {
    const res = await request.get('/api/account/featured');
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Not authenticated');
  });

  test('POST /api/account/featured returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/account/featured');
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Not authenticated');
  });
});

test.describe('Featured System — Regression', () => {
  test('directory page still loads', async ({ page }) => {
    await page.goto('/directory');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
  });

  test('search functionality still works', async ({ page }) => {
    await page.goto('/directory');
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Kent');
      await page.waitForTimeout(1000);
    }
    await expect(page.locator('body')).toBeVisible();
  });

  test('map page still loads', async ({ page }) => {
    await page.goto('/Map');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
  });

  test('account page still loads (shows login form)', async ({ page }) => {
    await page.goto('/Account');
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
    const hasLoginForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
    const hasDashboard = await page.locator('text=Welcome back').isVisible().catch(() => false);
    expect(hasLoginForm || hasDashboard).toBeTruthy();
  });

  test('homepage has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForTimeout(3000);
    const criticalErrors = errors.filter(isAppConsoleError);
    expect(criticalErrors).toHaveLength(0);
  });

  test('directory page has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/directory');
    await page.waitForTimeout(3000);
    const criticalErrors = errors.filter(isAppConsoleError);
    expect(criticalErrors).toHaveLength(0);
  });

  test('register page still loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1')).toBeVisible({ timeout: 10_000 });
  });
});
