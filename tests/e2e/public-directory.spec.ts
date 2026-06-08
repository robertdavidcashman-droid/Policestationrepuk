import { test, expect } from '@playwright/test';

test.describe('Directory pages load', () => {
  test('main /directory page loads', async ({ page }) => {
    const res = await page.goto('/directory');
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('directory shows rep results', async ({ page }) => {
    await page.goto('/directory');
    await page.waitForTimeout(2_000);
    const cards = page.locator('[class*="DirectoryCard"], a[href^="/rep/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('/directory/counties page loads', async ({ page }) => {
    const res = await page.goto('/directory/counties');
    expect(res?.status()).toBe(200);
  });

  test('/directory/kent loads (county page)', async ({ page }) => {
    const res = await page.goto('/directory/kent');
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('/search page loads', async ({ page }) => {
    const res = await page.goto('/search');
    expect(res?.status()).toBe(200);
  });
});

test.describe('Recently Joined section', () => {
  test('home page shows recently joined representatives', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('section', { hasText: /recently joined/i });
    await expect(section).toBeVisible();
    const repLinks = section.locator('a[href^="/rep/"]');
    const count = await repLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Rep profiles', () => {
  test('individual rep page loads (/rep/[slug])', async ({ page }) => {
    await page.goto('/directory');
    await page.waitForTimeout(2_000);
    const firstRepLink = page.locator('a[href^="/rep/"]').first();
    const href = await firstRepLink.getAttribute('href');
    expect(href).toBeTruthy();

    const res = await page.goto(href!);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Map page', () => {
  test('/Map page loads', async ({ page }) => {
    const res = await page.goto('/Map');
    expect(res?.status()).toBe(200);
  });
});

test.describe('Account / Auth pages', () => {
  test('/Account page loads', async ({ page }) => {
    const res = await page.goto('/Account');
    expect(res?.status()).toBe(200);
  });

  test('/Profile page loads', async ({ page }) => {
    const res = await page.goto('/Profile');
    expect(res?.status()).toBe(200);
  });
});

test.describe('Cross-domain redirects', () => {
  test('.com root redirects to .org', async ({ page }) => {
    await page.goto('https://policestationrepuk.com/');
    expect(page.url()).toContain('policestationrepuk.org');
  });

  test('.com/register redirects to .org/register', async ({ page }) => {
    await page.goto('https://policestationrepuk.com/register');
    expect(page.url()).toContain('policestationrepuk.org');
    expect(page.url()).toContain('/register');
  });

  test('policestationrepukdirectory.com redirects to .org', async ({ page }) => {
    await page.goto('https://policestationrepukdirectory.com/');
    expect(page.url()).toContain('policestationrepuk.org');
  });

  test('/Register (capital R) redirects to /register', async ({ page }) => {
    await page.goto('/Register');
    expect(page.url()).toContain('/register');
    expect(page.url()).not.toContain('/Register');
  });

  test('/Directory (capital D) redirects to /directory', async ({ page }) => {
    await page.goto('/Directory');
    expect(page.url()).toContain('/directory');
  });
});

test.describe('No console errors on key pages', () => {
  for (const route of ['/', '/register', '/directory', '/Join', '/Account', '/Map']) {
    test(`no JS errors on ${route}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.goto(route, { waitUntil: 'networkidle' });
      expect(errors).toEqual([]);
    });
  }
});
