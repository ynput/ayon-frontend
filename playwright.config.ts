import { ayonConfig } from '@ynput/ayon-e2e/config'
import path from 'path'

const AUTH_FILE = path.join(__dirname, 'playwright/.auth/admin.json')

// The shared settings, the frontend server and the setup/chromium projects come from
// @ynput/ayon-e2e (e2e/AGENTS.md). .env.test.local holds the test credentials.
export default ayonConfig(
  {},
  {
    globalTeardown: './tests/e2e/global.teardown.ts',
    projects: [
      // pure logic tests, no browser or server needed
      { name: 'unit', testDir: './tests/unit' },
      // the chromium tests start signed in as the admin (auth.setup.ts)
      { name: 'chromium', use: { storageState: AUTH_FILE } },
    ],
  },
)
