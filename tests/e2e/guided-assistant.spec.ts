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
  await page.getByRole('button', { name: 'Send', exact: true }).click();
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
      primaryMatch?: unknown;
      disclaimer?: string;
    };
    expect(body.refused).toBe(false);
    expect(body.mode).toBe('faq');
    expect(body.matches?.length).toBeGreaterThan(0);
    expect(body.primaryMatch).toBeTruthy();
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

test.describe('/ai-assistant page', () => {
  test('loads with chat input, disclaimer, and starter prompts', async ({ page }) => {
    const response = await page.goto('/ai-assistant');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: /AI assistant/i })).toBeVisible();
    await expect(page.getByLabel('Ask a question')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeVisible();
    await expect(page.getByText(/not legal advice/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'How do I register on the directory?' })).toBeVisible();
  });

  test('redirects /guided-assistant to /ai-assistant', async ({ page }) => {
    await page.goto('/ai-assistant');
    await expect(page).toHaveURL(/\/ai-assistant$/);
  });

  test('FAQ question shows assistant chat reply', async ({ page }) => {
    await page.goto('/ai-assistant');
    await askAssistant(page, 'Do I need a DSCC PIN number?');
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion).toContainText(/dscc/i);
  });

  test('case-specific question shows refusal message', async ({ page }) => {
    await page.goto('/ai-assistant');
    await askAssistant(page, 'I was arrested — what should I say in interview?');
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion).toContainText(/cannot give advice/i);
    await expect(liveRegion.getByRole('link', { name: /free legal advice/i })).toBeVisible();
  });

  test('starter prompt chip submits without typing', async ({ page }) => {
    await page.goto('/ai-assistant');
    await page.getByRole('button', { name: 'Join WhatsApp group' }).click();
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion).toContainText(/whatsapp/i);
  });

  test('keyboard submit works from the input', async ({ page }) => {
    await page.goto('/ai-assistant');
    const input = page.getByLabel('Ask a question');
    await input.fill('How do I register on the directory?');
    await input.press('Enter');
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion).toContainText(/register|directory/i);
  });

  test('mobile viewport remains usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ai-assistant');
    await expect(page.getByLabel('Ask a question')).toBeVisible();
    await askAssistant(page, 'Find station phone numbers');
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion).toContainText(/station|directory|phone/i);
  });
});

test.describe('floating AI chat widget', () => {
  test('Ask AI tab returns FAQ answers in chat bubbles', async ({ page }) => {
    await page.goto('/FAQ');
    await page.getByRole('button', { name: 'Open AI assistant' }).click();
    await expect(page.getByText(/AI assistant · Site/i)).toBeVisible();
    await askAssistant(page, 'How do I register on the directory?');
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion).toContainText(/register|directory/i);
  });

  test('FAB is viewport-fixed without scrolling on a long page', async ({ page }) => {
    await page.goto('/FAQ');
    const fab = page.getByRole('button', { name: 'Open AI assistant' });
    await expect(fab).toBeVisible();
    const beforeScroll = await fab.boundingBox();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const afterScroll = await fab.boundingBox();
    expect(beforeScroll).toBeTruthy();
    expect(afterScroll).toBeTruthy();
    expect(afterScroll!.y).toBeCloseTo(beforeScroll!.y, 0);
  });
});

test.describe('header and homepage Ask AI entry points', () => {
  test('header Ask AI opens the floating panel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.locator('header').getByRole('button', { name: 'Ask AI' }).click();
    await expect(page.getByRole('dialog', { name: 'AI assistant' })).toBeVisible();
    await expect(page.getByLabel('Ask a question')).toBeFocused();
  });

  test('homepage Open AI chat opens the same panel', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open AI chat' }).click();
    await expect(page.getByRole('dialog', { name: 'AI assistant' })).toBeVisible();
    await askAssistant(page, 'How do I register on the directory?');
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion).toContainText(/register|directory/i);
  });
});

test.describe('assistant cover and custody note routing', () => {
  test('custody note question returns Custody Note in chat', async ({ page }) => {
    await page.goto('/FAQ');
    await page.getByRole('button', { name: 'Open AI assistant' }).click();
    await askAssistant(page, 'tell me about custody note');
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion).toContainText(/Custody Note/i);
    await expect(liveRegion.getByRole('link', { name: /Custody Note/i })).toBeVisible();
  });

  test('Contact tab on FAQ has no Kent cover WhatsApp but has join group', async ({ page }) => {
    await page.goto('/FAQ');
    await page.getByRole('button', { name: 'Open AI assistant' }).click();
    const dialog = page.getByRole('dialog', { name: 'AI assistant' });
    await dialog.getByRole('button', { name: 'Contact', exact: true }).click();
    await expect(dialog.getByRole('link', { name: 'Join WhatsApp group' })).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Kent cover (WhatsApp)' })).toHaveCount(0);
  });

  test('Contact tab on homepage shows Kent cover WhatsApp', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open AI assistant' }).click();
    const dialog = page.getByRole('dialog', { name: 'AI assistant' });
    await dialog.getByRole('button', { name: 'Contact', exact: true }).click();
    await expect(dialog.getByRole('link', { name: 'Kent cover (WhatsApp)' })).toBeVisible();
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

  test('low-confidence career question shows AI answer in UI', async ({ page }) => {
    await page.goto('/ai-assistant');
    await askAssistant(page, 'tell me about becoming a rep after working in another field');
    const liveRegion = await waitForAssistantResult(page);
    await expect(liveRegion.getByText('AI answer')).toBeVisible({ timeout: 30_000 });
    await expect(liveRegion.getByText(/Based on our published guides/i)).toBeVisible();
  });
});
