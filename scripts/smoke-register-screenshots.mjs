#!/usr/bin/env node
/**
 * Live UI smoke test for the police-station-rep registration form.
 *
 * - Boots a Chromium tab against a running dev server (default
 *   http://localhost:3055).
 * - Walks Stage 1 (eligibility gate) → Stage 2 (full registration form) →
 *   Stage 4 (success) using SRA 190283 (the canned test solicitor).
 * - Saves a PNG at each stage of the journey to ./screenshots/register-smoke/
 * - Records every network request and asserts that NONE of them hit
 *   `challenges.cloudflare.com` — the regression guard for the "no more
 *   Turnstile on the registration form" rip-out.
 *
 * Usage:
 *   node scripts/smoke-register-screenshots.mjs              # against localhost:3055
 *   node scripts/smoke-register-screenshots.mjs https://...  # against any other host
 */

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const baseUrl = process.argv[2] || process.env.QA_BASE_URL || 'http://localhost:3055';
const screenshotDir = path.join(projectRoot, 'screenshots', 'register-smoke');

const TEST_EMAIL = `psrtest+${Date.now()}@example.com`;

const results = [];
function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(detail ? `${tag}  ${name} :: ${detail}` : `${tag}  ${name}`);
}

async function shoot(page, name) {
  const file = path.join(screenshotDir, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`SHOT  ${path.relative(projectRoot, file)}`);
}

async function main() {
  await fs.mkdir(screenshotDir, { recursive: true });
  // Wipe previous screenshots so the directory only contains this run.
  for (const f of await fs.readdir(screenshotDir).catch(() => [])) {
    if (f.endsWith('.png')) await fs.unlink(path.join(screenshotDir, f));
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Network telemetry.
  const turnstileHits = [];
  const requestUrls = [];
  page.on('request', (req) => {
    const url = req.url();
    requestUrls.push(`${req.method()} ${url}`);
    if (url.includes('challenges.cloudflare.com')) turnstileHits.push(url);
  });

  // Console errors are surfaced for diagnostic value.
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    /* ------------------------------------------------------------------ */
    /*  Stage 1 — eligibility gate                                        */
    /* ------------------------------------------------------------------ */
    const resp = await page.goto(new URL('/register', baseUrl).href, {
      waitUntil: 'networkidle',
    });
    record('GET /register -> 200', resp?.status() === 200, `status=${resp?.status()}`);

    await page.evaluate(() => {
      // Hide the Next.js dev overlay so it doesn't clutter the screenshots.
      document
        .querySelectorAll('nextjs-portal,[data-nextjs-toast]')
        .forEach((el) => el.remove());
    });

    record(
      'gate UI visible (Step 1 of 2 — eligibility check)',
      await page.locator('text=Step 1 of 2 — eligibility check').first().isVisible(),
    );
    record(
      'no Turnstile widget rendered on the page',
      (await page.locator('[data-cf-turnstile]').count()) === 0,
    );

    await shoot(page, '01-stage1-gate-empty.png');

    await page.locator('#gate-email').fill(TEST_EMAIL);
    await page
      .locator('input[name="gate-category"][value="solicitor"]')
      .check({ force: true });
    await page.locator('#gate-sraNumber').fill('190283');
    await page.evaluate(() => {
      document
        .querySelectorAll('nextjs-portal,[data-nextjs-toast]')
        .forEach((el) => el.remove());
    });
    await shoot(page, '02-stage1-gate-filled.png');

    /* ------------------------------------------------------------------ */
    /*  Stage 2 — full form                                               */
    /* ------------------------------------------------------------------ */
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/register/gate') && r.request().method() === 'POST',
      ),
      page.locator('button', { hasText: /verify eligibility/i }).click(),
    ]);

    await page
      .locator('text=Step 2 of 2 — full profile')
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });
    record('Step 2 of 2 — full profile is visible after gate submit', true);

    await page.evaluate(() => {
      document
        .querySelectorAll('nextjs-portal,[data-nextjs-toast]')
        .forEach((el) => el.remove());
    });
    await shoot(page, '03-stage2-form-unlocked.png');

    await page.locator('#fullName').fill('Robert Cashman Smoke');
    await page.locator('#mobile').fill('07535494446');
    await page.locator('#counties').fill('Kent');
    await page.locator('#stations').fill('Medway, Maidstone, North Kent');
    await page.locator('#availability').fill('24/7');
    await page.locator('input[type="checkbox"]').nth(0).check({ force: true });
    await page.locator('input[type="checkbox"]').nth(1).check({ force: true });

    await page.evaluate(() => {
      document
        .querySelectorAll('nextjs-portal,[data-nextjs-toast]')
        .forEach((el) => el.remove());
    });
    await shoot(page, '04-stage2-form-filled.png');

    /* ------------------------------------------------------------------ */
    /*  Stage 4 — success                                                 */
    /* ------------------------------------------------------------------ */
    let registerResp = null;
    try {
      [registerResp] = await Promise.all([
        page.waitForResponse(
          (r) => r.url().endsWith('/api/register') && r.request().method() === 'POST',
        ),
        page.locator('button', { hasText: /submit registration/i }).click(),
      ]);
    } catch (e) {
      record('POST /api/register fired', false, String(e));
    }
    if (registerResp) {
      record(
        'POST /api/register returned a 2xx',
        registerResp.status() >= 200 && registerResp.status() < 300,
        `status=${registerResp.status()}`,
      );
    }

    // Wait a moment for the success / error panel to render.
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      document
        .querySelectorAll('nextjs-portal,[data-nextjs-toast]')
        .forEach((el) => el.remove());
    });
    await shoot(page, '05-stage4-after-submit.png');

    /* ------------------------------------------------------------------ */
    /*  Network regression guard                                          */
    /* ------------------------------------------------------------------ */
    record(
      'no requests to challenges.cloudflare.com (Turnstile is gone)',
      turnstileHits.length === 0,
      turnstileHits.length === 0 ? '0 Turnstile requests' : turnstileHits.join('\n'),
    );
    record(
      'no console errors during the journey',
      consoleErrors.length === 0,
      consoleErrors.length === 0 ? '' : consoleErrors.slice(0, 3).join(' || '),
    );

    /* ------------------------------------------------------------------ */
    /*  Save a manifest                                                   */
    /* ------------------------------------------------------------------ */
    const manifest = {
      ranAt: new Date().toISOString(),
      baseUrl,
      testEmail: TEST_EMAIL,
      turnstileHits,
      consoleErrors,
      results,
      requestSample: requestUrls.slice(0, 30),
    };
    await fs.writeFile(
      path.join(screenshotDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf-8',
    );
    console.log(`MANIFEST  ${path.relative(projectRoot, path.join(screenshotDir, 'manifest.json'))}`);
  } finally {
    await context.close();
    await browser.close();
  }

  const fails = results.filter((r) => !r.ok);
  console.log(`\nsmoke-register-screenshots: ${results.length - fails.length}/${results.length} passed.`);
  if (fails.length) {
    console.error(`${fails.length} check(s) failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
