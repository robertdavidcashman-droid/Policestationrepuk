import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PW_BASE_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests/ci-smoke',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 1,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
