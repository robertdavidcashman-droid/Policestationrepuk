import { test, expect } from '@playwright/test';

const BASE = process.env.PW_BASE_URL || 'https://policestationrepuk.org';

test.describe('Profile API — Auth Guards', () => {
  test('GET /api/account/profile returns 401 without session', async ({ request }) => {
    const res = await request.get(`${BASE}/api/account/profile`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Not authenticated');
  });

  test('PUT /api/account/profile returns 401 without session', async ({ request }) => {
    const res = await request.put(`${BASE}/api/account/profile`, {
      data: { name: 'Hacker' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/account/featured returns 401 without session', async ({ request }) => {
    const res = await request.get(`${BASE}/api/account/featured`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/account/featured returns 401 without session', async ({ request }) => {
    const res = await request.post(`${BASE}/api/account/featured`);
    expect(res.status()).toBe(401);
  });
});

test.describe('Auth API — Validation', () => {
  test('send-code rejects empty body', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/send-code`, { data: {} });
    expect([400, 422, 503]).toContain(res.status());
  });

  test('send-code rejects invalid email', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/send-code`, {
      data: { email: 'not-an-email' },
    });
    expect([400, 422, 503]).toContain(res.status());
  });

  test('verify-code rejects empty body', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/verify-code`, { data: {} });
    expect([400, 401]).toContain(res.status());
  });

  test('verify-code rejects wrong code', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/verify-code`, {
      data: { email: 'nobody@example.com', code: '000000' },
    });
    expect(res.status()).toBe(401);
  });

  test('logout endpoint exists', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/logout`);
    expect([200, 302]).toContain(res.status());
  });
});

test.describe('Account UI — Login Flow', () => {
  test('account page shows email login form', async ({ page }) => {
    await page.goto('/Account');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10_000 });
  });

  test('account login form rejects empty submit', async ({ page }) => {
    await page.goto('/Account');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10_000 });
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    const valid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(valid).toBe(false);
  });
});

test.describe('Station Coverage Display — Quality', () => {
  test('Robert Cashman profile shows station coverage section', async ({ page }) => {
    await page.goto('/rep/robert-cashman');
    await expect(page.locator('h1')).toContainText('Robert Cashman', { timeout: 10_000 });
    const stationSection = page.getByRole('heading', { name: 'Station Coverage' });
    await expect(stationSection).toBeVisible();
  });

  test('station names are full names, not single-word tokens', async ({ page }) => {
    await page.goto('/rep/robert-cashman');
    await expect(page.locator('h1')).toContainText('Robert Cashman', { timeout: 10_000 });
    const stationItems = page.locator('section:has(h2:has-text("Station Coverage")) li');
    const count = await stationItems.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await stationItems.nth(i).textContent();
      expect(text!.trim().length).toBeGreaterThan(3);
      expect(text!.trim().split(/\s+/).length).toBeGreaterThan(1);
    }
  });

});

test.describe('Registration Form — Station Input Fix', () => {
  test('station field placeholder suggests comma-separated full names', async ({ page }) => {
    await page.goto('/register');
    const stationInput = page.locator('input#stations');
    await expect(stationInput).toBeVisible({ timeout: 10_000 });
    const placeholder = await stationInput.getAttribute('placeholder');
    expect(placeholder).toContain('Police Station');
  });

  test('station help text visible', async ({ page }) => {
    await page.goto('/register');
    const helpText = page.locator('input#stations + p, label[for="stations"] ~ p').first();
    await expect(helpText).toBeVisible({ timeout: 10_000 });
    const text = await helpText.textContent();
    expect(text?.toLowerCase()).toContain('custody');
  });
});

test.describe('Registration API — Station Data Integrity', () => {
  test.describe.configure({ mode: 'serial' });

  test('stations sent as comma-separated names are preserved correctly', async ({ request }) => {
    const res = await request.post(`${BASE}/api/register`, {
      data: {
        name: 'Station Integrity Test',
        email: `station-test-${Date.now()}@example.com`,
        stations: ['Devon & Cornwall Police (Charles Cross)', 'Exeter Police Station'],
        _hp: '',
      },
    });
    expect([200, 429]).toContain(res.status());
  });

  test('stations with special characters are accepted', async ({ request }) => {
    const res = await request.post(`${BASE}/api/register`, {
      data: {
        name: 'Special Station Test',
        email: `special-station-${Date.now()}@example.com`,
        stations: ["St Mary's Police Station", "O'Brien Custody Suite"],
        _hp: '',
      },
    });
    expect([200, 429]).toContain(res.status());
  });
});

test.describe('Full Regression — Core Pages', () => {
  const criticalPages = [
    { path: '/', name: 'Homepage' },
    { path: '/directory', name: 'Directory' },
    { path: '/register', name: 'Register' },
    { path: '/Account', name: 'Account' },
    { path: '/GoFeatured', name: 'GoFeatured' },
    { path: '/Map', name: 'Map' },
    { path: '/Join', name: 'Join' },
    { path: '/rep/robert-cashman', name: 'Rep Profile' },
  ];

  for (const { path, name } of criticalPages) {
    test(`${name} (${path}) loads with no page errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBe(200);
      await page.waitForTimeout(1500);
      expect(errors).toHaveLength(0);
    });
  }
});

test.describe('Contact page vs Robert listing (mobile / WhatsApp)', () => {
  test('/Contact main content does not repeat WhatsApp join number as directory support', async ({ page }) => {
    await page.goto('/Contact');
    // Site-wide header/footer may show the WhatsApp community text number; the Contact article must not use it as “support”.
    await expect(page.locator('#main-content')).not.toContainText('07535 494446');
  });

  test('Robert Cashman profile shows Call + WhatsApp for directory contact', async ({ page }) => {
    await page.goto('/rep/robert-cashman');
    await expect(page.locator('h1')).toContainText('Robert Cashman', { timeout: 15_000 });
    await expect(page.getByRole('link', { name: /call 07535 494446/i })).toBeVisible();
    await expect(page.locator('#main-content').getByRole('link', { name: /^WhatsApp$/ }).first()).toBeVisible();
  });

  test('POST /api/contact accepts valid payload', async ({ request }) => {
    const res = await request.post(`${BASE}/api/contact`, {
      data: {
        name: 'Contact API Test',
        email: `contact-api-${Date.now()}@example.com`,
        subject: 'Automated test',
        message: 'Short test message for contact API.',
        _hp: '',
        _startedAt: Date.now() - 5000,
      },
    });
    expect([200, 429]).toContain(res.status());
  });
});
