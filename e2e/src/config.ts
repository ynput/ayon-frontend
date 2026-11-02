import { defineConfig, devices, PlaywrightTestConfig } from '@playwright/test'
import dotenv from 'dotenv'

export interface AyonConfigOptions {
  /** port of the AYON frontend Playwright starts (default 3100, TEST_PORT overrides it) */
  port?: number
  /**
   * the ayon-frontend checkout AYON is built from (default: the current folder).
   * TEST_FRONTEND_DIR overrides it.
   */
  frontendDir?: string
  /**
   * an addon's suite: the addon's name, and the port `ayon-addon dev --ayon` serves its build on
   * (default 5183, TEST_ADDON_PORT overrides it). AYON loads that build instead of the installed one.
   */
  addon?: { name: string; port?: number }
}

/**
 * The Playwright config for AYON tests. `configs` are merged in with `defineConfig`: projects by
 * name, `use` key by key, web servers added.
 *
 * Environment (.env.test.local, then .env.local): TEST_USER_NAME / TEST_USER_PASSWORD (an admin),
 * TEST_BACKEND_URL (the server, default http://localhost:5000), TEST_SERVER_URL (test a running
 * frontend instead of starting one), TEST_DEV_SERVER=1 (vite dev server instead of a build),
 * TEST_WORKERS (default 2).
 */
export const ayonConfig = (options: AyonConfigOptions = {}, ...configs: PlaywrightTestConfig[]) => {
  dotenv.config({ path: ['.env.test.local', '.env.local'], quiet: true })

  // one id per run, set in the main process so every worker inherits the same value (see names.ts)
  process.env.E2E_RUN_ID ||= Date.now().toString(36).slice(-5)

  const port = Number(process.env.TEST_PORT || options.port || 3100)
  // frontend under test; by default a dedicated server, so a running `yarn dev` is never reused
  const baseURL = process.env.TEST_SERVER_URL || `http://localhost:${port}`
  // backend the frontend server proxies to
  const backendURL = process.env.TEST_BACKEND_URL || process.env.SERVER_URL || 'http://localhost:5000'
  const frontendDir = process.env.TEST_FRONTEND_DIR || options.frontendDir

  const webServer: NonNullable<PlaywrightTestConfig['webServer']> = []
  if (!process.env.TEST_SERVER_URL) {
    // By default the app is built once and served with `vite preview` (same /api proxy as the dev
    // server). The dev server serves hundreds of unbundled modules per page load, which is too slow
    // with several workers. TEST_DEV_SERVER=1 uses it anyway (handy while writing tests, HMR included).
    webServer.push({
      command: process.env.TEST_DEV_SERVER
        ? `npx vite --port ${port} --strictPort`
        : `npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${port} --strictPort`,
      cwd: frontendDir,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: { SERVER_URL: backendURL },
    })
  }
  if (options.addon) {
    const addonPort = Number(process.env.TEST_ADDON_PORT || options.addon.port || 5183)
    // read by the fixtures and helpers in the workers (env.ts)
    process.env.TEST_ADDON_NAME = options.addon.name
    process.env.TEST_ADDON_URL ||= `http://localhost:${addonPort}`
    webServer.push({
      command: `node ./node_modules/@ynput/ayon-addon-dev/dist/cli.js dev --ayon --port ${addonPort}`,
      url: `${process.env.TEST_ADDON_URL}/ayon-addon.json`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    })
  }

  return defineConfig(
    {
      testDir: './tests/e2e',
      fullyParallel: true,
      forbidOnly: !!process.env.CI,
      // transient backend hiccups are retried; retried passes are reported as "flaky"
      retries: process.env.CI ? 2 : 1,
      // Every test creates and drops its own project (a Postgres schema). More than ~2 workers against
      // a local docker server stalls the backend (redis/db timeouts), so default to 2.
      workers: Number(process.env.TEST_WORKERS) || 2,
      reporter: process.env.CI
        ? [['github'], ['html', { open: 'never' }]]
        : [['list'], ['html', { open: 'never' }]],
      timeout: 60_000,
      expect: { timeout: 15_000 },
      use: {
        baseURL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 15_000,
        navigationTimeout: 30_000,
      },
      projects: [
        // checks and sessions every test needs (*.setup.ts)
        { name: 'setup', testMatch: /.*\.setup\.ts/ },
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 1000 } },
          dependencies: ['setup'],
        },
      ],
      webServer,
    },
    ...configs,
  )
}
