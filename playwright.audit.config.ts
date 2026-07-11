import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3100';
const START_LOCAL_SERVER = process.env.AUDIT_NO_WEBSERVER !== '1';

export default defineConfig({
  testDir: './tests/audit',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: 0,
  workers: process.env.CI ? 2 : 2,
  reporter: [
    ['list'],
    ['json', { outputFile: 'reports/playwright-audit.json' }],
    ['html', { outputFolder: 'reports/playwright-html', open: 'never' }],
  ],
  outputDir: 'reports/playwright-artifacts',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit-smoke',
      testMatch: /cross-browser\.spec\.ts/,
      use: { ...devices['Desktop Safari'] },
    },
  ],
  ...(START_LOCAL_SERVER
    ? {
        webServer: {
          command: 'npm run start -- --port 3100',
          url: BASE_URL,
          reuseExistingServer: false,
          timeout: 180_000,
          stdout: 'pipe',
          stderr: 'pipe',
          env: {
            NODE_ENV: 'production',
            PORT: '3100',
            NEXT_PUBLIC_SITE_URL: BASE_URL,
            LEGACY_REPS_PUBLIC: '1',
            CRON_SECRET: process.env.CRON_SECRET || 'ci-smoke-placeholder-not-for-production',
            // Isolate audit from production KV / Vercel runtime flags on developer machines.
            VERCEL: '',
            VERCEL_ENV: '',
            KV_REST_API_URL: '',
            KV_REST_API_TOKEN: '',
            UPSTASH_REDIS_REST_URL: '',
            UPSTASH_REDIS_REST_TOKEN: '',
          },
        },
      }
    : {}),
});
