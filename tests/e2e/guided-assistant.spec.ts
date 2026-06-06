/**
 * Guided assistant — UI and API smoke tests.
 *
 * Local (recommended):
 *   npm run dev
 *   PW_BASE_URL=http://localhost:3000 npx playwright test guided-assistant.spec.ts
 *
 * Production read-only smoke:
 *   PW_BASE_URL=https://policestationrepuk.com npx playwright test guided-assistant.spec.ts
 *
 * Optional live LLM UI check (server must have OPENAI_API_KEY):
 *   PW_ASSISTANT_LLM_E2E=1 PW_BASE_URL=http://localhost:3000 npx playwright test guided-assistant.spec.ts -g "LLM"
 */

import { test, expect } from '@playwright/test';

const LLM_E2E_ENABLED = process.env.PW_ASSISTANT_LLM_E2E === '1';

let assistantApiAvailable = false;

test.beforeAll(async ({ request }) => {
  const response = await request.post('/api/assistant/query', {
    data: { message: 'How do I register on the directory?' },
    failOnStatusCode: false,
  });
  assistantApiAvailable = response.status() === 200;
});

test.beforeEach(() => {
  test.skip(
    !assistantApiAvailable,
    'Assistant API unavailable on this base URL — use npm run test:assistant:e2e (local dev server) or deploy first'
  );
});

async function askAssistant(page: import('@playwright/test').Page, question: string) {
  const input = page.getByLabel('Ask a question');
  await input.fill(question);
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
}

async function waitForAssistantResult(page: import('@playwright/test').Page) {
  const liveRegion = page.locator('[aria-live="polite"]');
  await expect(liveRegion).not.toBeEmpty({ timeout: 15_000 });
  return liveRegion;
}

test.describe('POST /api/assistant/query — live API', () => {
  test('FAQ registration question returns mode faq', async ({ request }) => {
    const response = await request.post('/api/assistant/query', {
      data: { message: 'How do I register on the directory for free?' },
    });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      mode?: string;
      refused?: boolean;
      matches?: unknown[];
      disclaimer?: string;
    };
    expect(body.refused).toBe(false);
    expect(body.mode).toBe('faq');
    expect(body.matches?.length).toBeGreaterThan(0);
    expect(body.disclaimer).toMatch(/not legal advice/i);
  });

  test('case-specific question is refused', async ({ request }) => {
    const response = await request.post('/api/assistant/query', {
      data: { message: 'My client wants to no comment — what should I advise?' },
    });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { refused?: boolean; refusalMessage?: string };
    expect(body.refused).toBe(true);
    expect(body.refusalMessage).toMatch(/cannot give advice/i);
  });

  test('empty message returns 400', async ({ request }) => {
    const response = await request.post('/api/assistant/query', {
      data: { message: '' },
    });
    expect(response.status()).toBe(400);
  });

  test('honeypot returns silent success', async ({ request }) => {
    const response = await request.post('/api/assistant/query', {
      data: { _hp: true, message: 'bot' },
    });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { matches?: unknown[]; refused?: boolean };
    expect(body.refused).toBe(false);
    expect(body.matches).toEqual([]);
  });
});

test.describe('/guided-assistant page', () => {
  test('loads with form, disclaimer, and starter prompts', async ({ page }) => {
    const response = await page.goto('/guided-assistant');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: /guided assistant/i })).toBeVisible();
    await expect(page.getByLabel('Ask a question')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ask', exact: true })).toBeVisible();
    await expect(page.getByText(/not legal advice/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'How do I register on the directory?' })).toBeVisible();
  });

  test('FAQ question shows a matched guide card', async ({ page }) => {
    await page.goto('/guided-assistant');
    await askAssistant(page, 'Do I need a DSCC PIN number?');
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion.getByRole('heading', { level: 3 }).first()).toBeVisible();
    await expect(liveRegion).toContainText(/dscc/i);
  });

  test('case-specific question shows refusal message', async ({ page }) => {
    await page.goto('/guided-assistant');
    await askAssistant(page, 'I was arrested — what should I say in interview?');
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion).toContainText(/cannot give advice/i);
    await expect(liveRegion.getByRole('link', { name: /free legal advice/i })).toBeVisible();
  });

  test('starter prompt chip submits without typing', async ({ page }) => {
    await page.goto('/guided-assistant');
    await page.getByRole('button', { name: 'Join WhatsApp group' }).click();
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion).toContainText(/whatsapp/i);
  });

  test('keyboard submit works from the input', async ({ page }) => {
    await page.goto('/guided-assistant');
    const input = page.getByLabel('Ask a question');
    await input.fill('How do I register on the directory?');
    await input.press('Enter');
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion.getByRole('heading', { level: 3 }).first()).toBeVisible();
  });

  test('mobile viewport remains usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/guided-assistant');
    await expect(page.getByLabel('Ask a question')).toBeVisible();
    await askAssistant(page, 'Find station phone numbers');
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion).toContainText(/station|directory|phone/i);
  });
});

test.describe('floating help widget', () => {
  test('Ask tab returns FAQ answers', async ({ page }) => {
    await page.goto('/FAQ');
    await page.getByRole('button', { name: 'Open help assistant' }).click();
    await expect(page.getByText('Search our FAQs and guides')).toBeVisible();
    await askAssistant(page, 'How do I register on the directory?');
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion.getByRole('heading', { level: 3 }).first()).toBeVisible();
  });
});

test.describe('LLM answers (requires OPENAI_API_KEY on server)', () => {
  test.skip(!LLM_E2E_ENABLED, 'Set PW_ASSISTANT_LLM_E2E=1 with OPENAI_API_KEY on the target server');

  test('low-confidence career question returns guided answer via API', async ({ request }) => {
    const response = await request.post('/api/assistant/query', {
      data: { message: 'tell me about becoming a rep after working in another field' },
      timeout: 30_000,
    });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { mode?: string; llmAnswer?: string };
    expect(body.mode).toBe('llm');
    expect(body.llmAnswer?.length).toBeGreaterThan(20);
  });

  test('low-confidence career question shows guided answer in UI', async ({ page }) => {
    await page.goto('/guided-assistant');
    await askAssistant(page, 'tell me about becoming a rep after working in another field');
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion.getByText('Guided answer')).toBeVisible({ timeout: 30_000 });
    await expect(liveRegion.getByText(/Based on our published guides/i)).toBeVisible();
  });
});
