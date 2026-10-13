import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Page load benchmarks. See tests/performance/AGENTS.md for how to run and read them.
dotenv.config({ path: ['.env.local'] })

const PORT = Number(process.env.PERF_PORT || 4173)
// 'preview' serves the production build (run `yarn build` first), 'dev' runs the vite dev server
const MODE = process.env.PERF_MODE || 'preview'
const EXTERNAL_URL = process.env.PERF_BASE_URL
const baseURL = EXTERNAL_URL || `http://localhost:${PORT}`

export const PERF_STORAGE_STATE = 'playwright/.auth/perf.json'

export default defineConfig({
  testDir: './tests/performance',
  testMatch: /.*\.perf\.ts/,
  // measurements must not compete with each other for CPU
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 15 * 60_000,
  reporter: [['list']],
  globalSetup: './tests/performance/globalSetup.ts',
  globalTeardown: './tests/performance/globalTeardown.ts',
  use: {
    ...devices['Desktop Chrome'],
    // e.g. PERF_CHANNEL=chrome to use the installed Google Chrome instead of Playwright's Chromium
    ...(process.env.PERF_CHANNEL ? { channel: process.env.PERF_CHANNEL } : {}),
    viewport: { width: 1600, height: 900 },
    baseURL,
    storageState: PERF_STORAGE_STATE,
  },
  webServer: EXTERNAL_URL
    ? undefined
    : {
        command:
          MODE === 'dev'
            ? `yarn vite --port ${PORT} --strictPort`
            : `yarn vite preview --port ${PORT} --strictPort`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000,
      },
})
