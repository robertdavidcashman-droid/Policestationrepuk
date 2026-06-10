import { test, expect } from '@playwright/test';

const PAGE = '/HowToBecomePoliceStationRep';

test.describe('HowToBecomePoliceStationRep regression', () => {
  test('renders exactly one H1', async ({ page }) => {
    const res = await page.goto(PAGE);
    expect(res?.status()).toBe(200);
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
  });

  test('no paragraph is a flattened content blob', async ({ page }) => {
    await page.goto(PAGE);
    const paragraphLengths = await page
      .locator('p:not([data-legal-text])')
      .evaluateAll((nodes) => nodes.map((el) => (el.textContent || '').trim().length));
    const longest = paragraphLengths.reduce((a, b) => Math.max(a, b), 0);
    expect.soft(longest, `Longest paragraph was ${longest} chars — content is flattened`).toBeLessThan(2000);
    expect(longest).toBeLessThan(2000);
  });

  test('every real heading from the crawled JSON appears as a real heading in the DOM', async ({ page }) => {
    await page.goto(PAGE);
    // Curated H2s from the 2026 rewrite — crawl JSON still holds legacy Wix headings.
    const wantedHeadings = [
      'What a police station rep does',
      'The legal framework',
      'Reality check — is this for you?',
      'Eligibility and prerequisites',
      'The route map at a glance',
      'Stage 1 — Enrol with an assessment organisation',
      'Stage 2 — Pass the Written Test',
      'Stage 3 — Portfolio (Part A and Part B)',
      'Stage 4 — Pass the Critical Incidents Test (CIT)',
      'Stage 5 — Get added to the Police Station Register',
      'The supervision problem',
      'Costs and timeline',
      'Life after accreditation',
      'Frequently asked questions',
    ];
    const renderedHeadings = (await page.locator('h2').allInnerTexts()).map((s) => s.trim());

    for (const wanted of wantedHeadings) {
      const found = renderedHeadings.some((r) => r.includes(wanted));
      expect.soft(found, `Missing H2 heading: ${wanted}`).toBeTruthy();
    }
  });

  test('does not show the article title repeated as plain body text', async ({ page }) => {
    await page.goto(PAGE);
    // Look only at the rendered article body, excluding the page <h1> and any breadcrumbs.
    const articleBody = await page.evaluate(() => {
      const article = document.querySelector('article') || document.querySelector('main') || document.body;
      const clone = article.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('h1, nav, [aria-label*="breadcrumb" i], header').forEach((el) => el.remove());
      return clone.innerText.trim();
    });
    const titleStub = 'How to Become a Police Station Representative';
    const occurrences = (articleBody.match(new RegExp(titleStub, 'g')) || []).length;
    expect.soft(occurrences, `Title appears ${occurrences} times in article body`).toBeLessThanOrEqual(2);
    expect(occurrences).toBeLessThanOrEqual(2);
  });

  test('does not show [object Object] anywhere', async ({ page }) => {
    await page.goto(PAGE);
    const body = await page.locator('body').innerText();
    expect(body).not.toContain('[object Object]');
  });

  test('does not show raw markdown markers', async ({ page }) => {
    await page.goto(PAGE);
    const body = await page.locator('main, article').first().innerText();
    expect(/(^|\n)#{1,6}\s+/.test(body)).toBeFalsy();
  });

  test('canonical, title and description are present', async ({ page }) => {
    await page.goto(PAGE);
    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
    const title = await page.title();
    const desc = await page.locator('meta[name="description"]').first().getAttribute('content');
    expect(canonical).toBeTruthy();
    expect(title).toBeTruthy();
    expect(desc).toBeTruthy();
  });
});
