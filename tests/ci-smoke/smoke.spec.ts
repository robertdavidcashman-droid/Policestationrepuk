import { test, expect } from '@playwright/test';

test.describe('production smoke', () => {
  test('health endpoint responds', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('ready endpoint responds with checks', async ({ request }) => {
    const res = await request.get('/api/ready');
    const body = await res.json();
    expect(body.checks).toBeDefined();
  });

  test('home page loads', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  });

  test('directory page loads', async ({ page }) => {
    const res = await page.goto('/directory');
    expect(res?.status()).toBeLessThan(400);
  });

  test('register gate page loads', async ({ page }) => {
    const res = await page.goto('/Register');
    expect(res?.status()).toBeLessThan(400);
  });
});
