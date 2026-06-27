import { defineConfig, devices } from '@playwright/test';

// Local-only config: uses the bundled full Chromium build (channel: 'chromium')
// so tests can run without downloading chrome-headless-shell.
const BASE_URL = process.env.PW_BASE_URL || 'http://localhost:3001';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  workers: 3,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    channel: 'chrome',
    trace: 'off',
    screenshot: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
  ],
});
