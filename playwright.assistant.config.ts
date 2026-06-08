import { defineConfig, devices } from '@playwright/test';

/**
 * Guided assistant E2E — spins up (or reuses) the local Next dev server.
 *
 *   npm run test:assistant:e2e
 *
 * Production smoke (after deploy):
 *   PW_BASE_URL=https://policestationrepuk.com npx playwright test tests/e2e/guided-assistant.spec.ts
 */
const BASE_URL = process.env.PW_BASE_URL || 'http://127.0.0.1:3000';
const useLocalWebServer = !process.env.PW_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'guided-assistant.spec.ts',
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.PW_USE_SYSTEM_CHROME === '1' ? { channel: 'chrome' as const } : {}),
      },
    },
  ],
  webServer: useLocalWebServer
    ? {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
