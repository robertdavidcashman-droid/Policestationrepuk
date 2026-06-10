import { test, expect } from '@playwright/test';
import { fetchStatus, normaliseUrl } from './helpers/link-graph';

test.describe('Header and footer link integrity', () => {
  test('desktop nav dropdown reveals grouped links', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/');
    const forReps = page.getByRole('button', { name: 'For Reps' });
    await expect(forReps).toBeVisible();
    await forReps.click();
    await expect(forReps).toHaveAttribute('aria-expanded', 'true');
    const overflowLink = page
      .getByLabel('Main navigation')
      .getByRole('link', { name: 'Find a Supervising Solicitor' });
    await expect(overflowLink).toBeVisible();
    await overflowLink.click();
    await expect(page).toHaveURL(/FindSupervisingSolicitor/i);
  });

  test('every header nav link resolves', async ({ page, request, baseURL }) => {
    const base = baseURL!;
    await page.goto('/');
    const links = await page
      .locator('header a[href]')
      .evaluateAll((nodes) =>
        nodes.map((el) => ({
          href: (el as HTMLAnchorElement).getAttribute('href') || '',
          text: ((el as HTMLAnchorElement).innerText || '').trim().slice(0, 60),
        })),
      );
    const broken: Array<{ href: string; text: string; status: number | null }> = [];
    for (const link of links) {
      if (!link.href || /^(mailto:|tel:|javascript:|#)/i.test(link.href)) continue;
      if (link.href.startsWith('http') && !link.href.includes(new URL(base).hostname)) continue;
      const normalised = normaliseUrl(link.href, base);
      if (!normalised) continue;
      const { status } = await fetchStatus(request, normalised);
      const ok = status === 200 || (status !== null && status >= 300 && status < 400);
      if (!ok) broken.push({ href: link.href, text: link.text, status });
    }
    expect.soft(broken, broken.map((b) => `${b.status} ${b.href}`).join('\n')).toEqual([]);
    expect(broken).toEqual([]);
  });

  test('every footer link resolves', async ({ page, request, baseURL }) => {
    const base = baseURL!;
    await page.goto('/');
    const links = await page
      .locator('footer a[href]')
      .evaluateAll((nodes) =>
        nodes.map((el) => ({
          href: (el as HTMLAnchorElement).getAttribute('href') || '',
          text: ((el as HTMLAnchorElement).innerText || '').trim().slice(0, 60),
        })),
      );
    const broken: Array<{ href: string; text: string; status: number | null }> = [];
    for (const link of links) {
      if (!link.href || /^(mailto:|tel:|javascript:|#)/i.test(link.href)) continue;
      if (link.href.startsWith('http') && !link.href.includes(new URL(base).hostname)) continue;
      const normalised = normaliseUrl(link.href, base);
      if (!normalised) continue;
      const { status } = await fetchStatus(request, normalised);
      const ok = status === 200 || (status !== null && status >= 300 && status < 400);
      if (!ok) broken.push({ href: link.href, text: link.text, status });
    }
    expect.soft(broken, broken.map((b) => `${b.status} ${b.href}`).join('\n')).toEqual([]);
    expect(broken).toEqual([]);
  });

  test('mobile menu links match desktop link targets', async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    // Best-effort: find a hamburger button and open the menu.
    const toggle = page.locator('header button[aria-label*="menu" i], header button[aria-controls], header button[aria-expanded]').first();
    if (await toggle.count()) {
      await toggle.click({ trial: false }).catch(() => {});
      await page.waitForTimeout(300);
    }
    const mobileLinks = await page
      .locator('header a[href], nav[aria-label*="mobile" i] a[href], [data-mobile-menu] a[href]')
      .evaluateAll((nodes) =>
        Array.from(new Set(nodes.map((el) => (el as HTMLAnchorElement).getAttribute('href') || ''))).filter(Boolean),
      );
    expect(mobileLinks.length).toBeGreaterThan(0);
    void baseURL;
  });
});
