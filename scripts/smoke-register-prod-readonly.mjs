#!/usr/bin/env node
/**
 * Read-only browser smoke for the production /register page.
 *
 * Unlike smoke-register-screenshots.mjs this script NEVER fills in or
 * submits the form — it loads /register and asserts:
 *
 *   1. The page returns 200.
 *   2. The "Step 1 of 2 — eligibility check" panel renders.
 *   3. The Cloudflare Turnstile widget is not on the page (no
 *      [data-cf-turnstile] node, no "Bot-protection check" copy).
 *   4. No requests fire to challenges.cloudflare.com from /register.
 *   5. There are no console errors during initial load.
 *
 * It saves a single screenshot of the live gate page to
 * screenshots/register-smoke/prod-stage1-gate-empty.png so you have proof
 * of what the production page looked like immediately after deploy.
 *
 * Default base URL: https://policestationrepuk.org
 *
 *   node scripts/smoke-register-prod-readonly.mjs
 *   node scripts/smoke-register-prod-readonly.mjs https://example.com
 */

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const baseUrl =
  process.argv[2] || process.env.QA_BASE_URL || 'https://policestationrepuk.org';
const screenshotDir = path.join(projectRoot, 'screenshots', 'register-smoke');

const results = [];
function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  const tag = ok ? 'PASS' : 'FAIL';
  console.log(detail ? `${tag}  ${name} :: ${detail}` : `${tag}  ${name}`);
}

async function main() {
  await fs.mkdir(screenshotDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const turnstileHits = [];
  const consoleErrors = [];
  page.on('request', (req) => {
    if (req.url().includes('challenges.cloudflare.com')) {
      turnstileHits.push(`${req.method()} ${req.url()}`);
    }
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  try {
    const target = new URL('/register', baseUrl).href;
    const resp = await page.goto(target, { waitUntil: 'networkidle' });
    record('GET /register -> 200', resp?.status() === 200, `status=${resp?.status()}`);

    record(
      'gate UI visible (Step 1 of 2 — eligibility check)',
      await page.locator('text=Step 1 of 2 — eligibility check').first().isVisible(),
    );
    record(
      'no Turnstile widget rendered on the page',
      (await page.locator('[data-cf-turnstile]').count()) === 0,
    );
    record(
      'no "Bot-protection check" label rendered on the page',
      (await page.locator('text=/Bot-protection check/').count()) === 0,
    );

    const file = path.join(screenshotDir, 'prod-stage1-gate-empty.png');
    await page.screenshot({ path: file, fullPage: true });
    console.log(`SHOT  ${path.relative(projectRoot, file)}`);

    record(
      'no requests to challenges.cloudflare.com',
      turnstileHits.length === 0,
      turnstileHits.length === 0
        ? '0 Turnstile requests'
        : turnstileHits.join('\n'),
    );
    record(
      'no console errors during initial load',
      consoleErrors.length === 0,
      consoleErrors.length === 0
        ? ''
        : consoleErrors.slice(0, 3).join(' || '),
    );

    const manifest = {
      ranAt: new Date().toISOString(),
      baseUrl,
      mode: 'read-only-production',
      turnstileHits,
      consoleErrors,
      results,
    };
    const manifestFile = path.join(screenshotDir, 'prod-manifest.json');
    await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`MANIFEST  ${path.relative(projectRoot, manifestFile)}`);
  } finally {
    await context.close();
    await browser.close();
  }

  const fails = results.filter((r) => !r.ok);
  console.log(
    `\nsmoke-register-prod-readonly: ${results.length - fails.length}/${results.length} passed.`,
  );
  if (fails.length) {
    console.error(`${fails.length} check(s) failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
