import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// .env.test.local holds the test credentials, .env.local is the regular dev config (fallback)
dotenv.config({ path: ['.env.test.local', '.env.local'], quiet: true })

// one id per run, set in the main process so every worker inherits the same value (see tests/e2e/support/names.ts)
process.env.E2E_RUN_ID ||= Date.now().toString(36).slice(-5)

const PORT = Number(process.env.TEST_PORT || 3100)
// frontend under test; by default a dedicated vite server so a running `yarn dev` is never reused
const BASE_URL = process.env.TEST_SERVER_URL || `http://localhost:${PORT}`
// backend the dev server proxies to
const BACKEND_URL =
  process.env.TEST_BACKEND_URL || process.env.SERVER_URL || 'http://localhost:5000'

const AUTH_FILE = path.join(__dirname, 'playwright/.auth/admin.json')

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // transient backend hiccups (see tests/AGENTS.md) are retried; retried passes are reported as "flaky"
  retries: process.env.CI ? 2 : 1,
  // Every test creates and drops its own project (a Postgres schema). More than ~2 workers against a
  // local docker server stalls the backend (redis/db timeouts), so default to 2 and allow overriding.
  workers: Number(process.env.TEST_WORKERS) || 2,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  globalTeardown: './tests/e2e/global.teardown.ts',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    // pure logic tests, no browser or server needed
    {
      name: 'unit',
      testDir: './tests/unit',
    },
    {
      name: 'setup',
      testDir: './tests/e2e',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 1000 },
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },
  ],
  // By default the app is built once and served with `vite preview` (same /api proxy as the dev server).
  // The dev server serves hundreds of unbundled modules per page load, which is too slow with several
  // workers. TEST_DEV_SERVER=1 uses the dev server instead (handy while writing tests, HMR included).
  webServer: process.env.TEST_SERVER_URL
    ? undefined
    : {
        command: process.env.TEST_DEV_SERVER
          ? `npx vite --port ${PORT} --strictPort`
          : `npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        env: { SERVER_URL: BACKEND_URL },
      },
})
