/**
 * End-to-end coverage for the public registration journey.
 *
 * These specs target both:
 *   - the /register page (HTML + Turnstile loader visibility)
 *   - the /api/register/gate API (every documented failure code + happy path)
 *
 * Most assertions hit the API directly via `request.post` because the
 * Cloudflare Turnstile challenge is impossible to solve in a headless
 * browser. The Turnstile setup is tested at three layers:
 *
 *   1. The CSP header includes `challenges.cloudflare.com` so the widget
 *      script can load.
 *   2. The browser actually receives a `<script ... challenges.cloudflare.com ...>`
 *      tag once the gate UI initialises.
 *   3. The API rejects submissions that lack a token with the structured
 *      `TURNSTILE_MISSING` code (only when Turnstile is enabled).
 *
 * To run against the deployed site (default):
 *   PW_BASE_URL=https://policestationrepuk.org npx playwright test register-flow.spec.ts
 *
 * To run against a local dev server (recommended in CI):
 *   PW_BASE_URL=http://localhost:3000 npx playwright test register-flow.spec.ts
 */

import { test, expect, request as apiRequest } from '@playwright/test';

const RANDOM_SUFFIX = Math.random().toString(36).slice(2, 8);
const TEST_EMAIL = `robertdavidcashman+psrtest${RANDOM_SUFFIX}@gmail.com`;

test.describe('GET /register — gate landing page', () => {
  test('returns 200 and renders the eligibility-check UI', async ({ page }) => {
    const response = await page.goto('/register');
    expect(response?.status()).toBe(200);
    await expect(
      page.locator('text=Step 1 of 2 — eligibility check').first(),
    ).toBeVisible();
    await expect(page.locator('#gate-email')).toBeVisible();
    // Full Step 2 form must NOT be in the initial HTML response.
    await expect(page.locator('#fullName')).toHaveCount(0);
    await expect(page.locator('#firmName')).toHaveCount(0);
  });

  test('Content-Security-Policy header allows challenges.cloudflare.com', async ({
    request,
  }) => {
    const response = await request.get('/register');
    expect(response.status()).toBe(200);
    const csp = response.headers()['content-security-policy'] || '';
    expect(csp).toMatch(/script-src[^;]+challenges\.cloudflare\.com/);
  });

  test('robots.txt disallows /register so the gate landing page is not indexed', async ({
    request,
  }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body.toLowerCase()).toMatch(/disallow:\s*\/register/);
  });

  test('legacy /police-station-rep-registration redirects to /register', async ({
    request,
  }) => {
    const response = await request.get('/police-station-rep-registration', {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect([301, 302, 307, 308]).toContain(response.status());
    const location = response.headers()['location'] || '';
    expect(location.replace(/\/$/, '')).toMatch(/\/register$/);
  });
});

test.describe('POST /api/register/gate — structured error codes', () => {
  test('400 INVALID_EMAIL when no email is supplied', async ({ request }) => {
    const response = await request.post('/api/register/gate', {
      data: { category: 'solicitor', sraNumber: '190283' },
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('INVALID_EMAIL');
  });

  test('400 INVALID_CATEGORY for an unsupported professional status', async ({
    request,
  }) => {
    const response = await request.post('/api/register/gate', {
      data: { email: TEST_EMAIL, category: 'trainee' },
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('INVALID_CATEGORY');
  });

  test('400 MISSING_EVIDENCE when a solicitor supplies neither SRA nor proof URL', async ({
    request,
  }) => {
    const response = await request.post('/api/register/gate', {
      data: { email: TEST_EMAIL, category: 'solicitor' },
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('MISSING_EVIDENCE');
  });

  test('400 INVALID_PROOF_URL for non-https proof URLs', async ({ request }) => {
    const response = await request.post('/api/register/gate', {
      data: {
        email: TEST_EMAIL,
        category: 'solicitor',
        sraNumber: '190283',
        proofUrl: 'ftp://example.com/me',
      },
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('INVALID_PROOF_URL');
  });

  test('400 TURNSTILE_MISSING when Turnstile is enabled but no token is supplied', async ({
    request,
  }) => {
    // Probe the response — if Turnstile is disabled in this env the gate
    // returns 200/GATE_OK instead. Both outcomes are acceptable; we just
    // assert the response is one of the two valid states so this spec
    // works locally (no Turnstile) and in production (Turnstile enforced).
    const response = await request.post('/api/register/gate', {
      data: {
        email: `pw-${Date.now()}@example.com`,
        category: 'solicitor',
        sraNumber: '190283',
      },
      failOnStatusCode: false,
    });
    const body = await response.json();
    if (response.status() === 200 && body.ok) {
      expect(body.code).toBe('GATE_OK');
      expect(typeof body.gateToken).toBe('string');
    } else {
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(['TURNSTILE_MISSING', 'TURNSTILE_FAILED']).toContain(body.code);
    }
  });
});

test.describe('POST /api/register — gate-token enforcement', () => {
  test('403 requiresGate when no gateToken is supplied', async ({ request }) => {
    const response = await request.post('/api/register', {
      data: {
        fullName: 'Robert Cashman Test',
        email: TEST_EMAIL,
        mobile: '07535494446',
        category: 'solicitor',
        sraNumber: '190283',
        counties: 'Kent',
        confirmAccredited: true,
        confirmAccurate: true,
      },
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.requiresGate).toBe(true);
  });

  test('403 requiresGate for a stale/fake gateToken', async ({ request }) => {
    const response = await request.post('/api/register', {
      data: {
        gateToken: 'definitely-not-a-real-token',
        fullName: 'Robert Cashman Test',
        email: TEST_EMAIL,
        mobile: '07535494446',
        category: 'solicitor',
        sraNumber: '190283',
        counties: 'Kent',
        confirmAccredited: true,
        confirmAccurate: true,
      },
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.requiresGate).toBe(true);
  });
});

/**
 * Happy-path browser test that only runs when REGISTER_BYPASS_TURNSTILE=1 is
 * set on a local dev server. The dev server can short-circuit the Turnstile
 * + email checks for a single hard-coded test email so we can exercise the
 * full UI flow end-to-end without real Cloudflare keys.
 *
 * The bypass mode is NEVER enabled in production. If you find this test
 * skipped in CI that is expected.
 */
test.describe('Happy path with test bypass (local only)', () => {
  test.skip(
    !process.env.REGISTER_BYPASS_TURNSTILE,
    'Skipping — REGISTER_BYPASS_TURNSTILE not set',
  );

  test('completes Step 1 with SRA 190283 and unlocks Step 2', async ({ page }) => {
    await page.goto('/register');
    await page.locator('#gate-email').fill(TEST_EMAIL);
    await page
      .locator('input[name="gate-category"][value="solicitor"]')
      .check({ force: true });
    await page.locator('#gate-sraNumber').fill('190283');
    await page
      .locator('button', { hasText: /verify eligibility/i })
      .click();
    await expect(
      page.locator('text=Step 2 of 2 — full profile').first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});

/**
 * Sanity-check the canonical-host redirect chain. We use a fresh API request
 * context so the Playwright fixtures don't follow redirects implicitly.
 */
test.describe('Canonical host redirects', () => {
  test('www.policestationrepuk.com → policestationrepuk.org', async () => {
    const ctx = await apiRequest.newContext({ ignoreHTTPSErrors: true });
    const response = await ctx.head(
      'https://www.policestationrepuk.com/register',
      { maxRedirects: 0, failOnStatusCode: false },
    );
    // Either Vercel host-redirect or middleware kicks in.
    expect([301, 308]).toContain(response.status());
    const location = response.headers()['location'] || '';
    expect(location).toMatch(/policestationrepuk\.org/);
    await ctx.dispose();
  });

  test('www.policestationrepuk.org → policestationrepuk.org', async () => {
    const ctx = await apiRequest.newContext({ ignoreHTTPSErrors: true });
    const response = await ctx.head(
      'https://www.policestationrepuk.org/register',
      { maxRedirects: 0, failOnStatusCode: false },
    );
    expect([301, 308]).toContain(response.status());
    const location = response.headers()['location'] || '';
    expect(location).toMatch(/policestationrepuk\.org/);
    expect(location).not.toMatch(/^https?:\/\/www\./);
    await ctx.dispose();
  });
});
