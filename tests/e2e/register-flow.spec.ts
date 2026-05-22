/**
 * End-to-end coverage for the public registration journey.
 *
 * These specs target both:
 *   - the /register page (HTML + initial gate UI visibility)
 *   - the /api/register/gate API (every documented failure code + happy path)
 *
 * Cloudflare Turnstile has been removed from the registration flow because it
 * was the dominant cause of "I entered the email code but the form never
 * opened" support tickets. Bot mitigation now relies on the silent honeypot,
 * per-IP rate limits, mandatory PIN/SRA/proof URL evidence and the server
 * risk-scoring step. Other forms on the site (Contact, secure rep
 * verification, report-this-profile) still use Turnstile; the CSP test for
 * `challenges.cloudflare.com` lives there instead of here.
 *
 * To run against the deployed site:
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

  test('register page no longer ships the Turnstile widget script', async ({
    page,
  }) => {
    // The /register page used to include `<script src="…challenges.cloudflare.com…">`
    // via the TurnstileWidget component. After the rip-out it must not load
    // any Turnstile/Cloudflare challenge script — that's the regression we
    // care about, not the CSP header (other forms still need Turnstile in
    // CSP).
    const turnstileRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('challenges.cloudflare.com')) turnstileRequests.push(url);
    });
    await page.goto('/register', { waitUntil: 'networkidle' });
    expect(turnstileRequests, turnstileRequests.join('\n')).toEqual([]);
    await expect(page.locator('[data-cf-turnstile]')).toHaveCount(0);
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

  test('200 GATE_OK for a valid solicitor with no Turnstile token (Turnstile is gone)', async ({
    request,
  }) => {
    const response = await request.post('/api/register/gate', {
      data: {
        email: `pw-${Date.now()}@example.com`,
        category: 'solicitor',
        sraNumber: '190283',
      },
      failOnStatusCode: false,
    });
    const body = await response.json();
    expect(response.status()).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.code).toBe('GATE_OK');
    expect(typeof body.gateToken).toBe('string');
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
 * Happy-path browser test. With Turnstile removed from the registration flow
 * this can run against any environment without env-var tricks: we just hit
 * the public gate endpoint via the UI and assert that Step 2 of the form
 * unlocks. (Email-code verification is gated on REQUIRE_ENQUIRY_EMAIL_VERIFICATION,
 * so we skip when that flag is on — the test cannot read inboxes.)
 */
test.describe('Happy path — Step 1 unlocks Step 2', () => {
  test.skip(
    process.env.REQUIRE_ENQUIRY_EMAIL_VERIFICATION === '1',
    'Skipping — email-code verification is on; this UI test cannot read inboxes',
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
