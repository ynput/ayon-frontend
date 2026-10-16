import { expect, test } from '../fixtures'
import { uniqueName } from '../support/names'

test.describe('bundles', () => {
  test('a saved bundle shows its compatibility issues', async ({ page }) => {
    const name = uniqueName('bundle')
    // bundles are studio-wide, so the page gets one fake saved bundle and a failing check
    await page.route(/\/api\/bundles(\?|$)/, (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({
            json: {
              bundles: [
                {
                  name,
                  createdAt: new Date().toISOString(),
                  addons: {},
                  installerVersion: null,
                  dependencyPackages: {},
                  isProduction: false,
                  isStaging: false,
                  isArchived: false,
                  isDev: false,
                  isProject: false,
                },
              ],
            },
          })
        : route.fallback(),
    )
    await page.route('**/api/bundles/check', (route) =>
      route.fulfill({
        json: {
          success: false,
          issues: [{ severity: 'error', addon: 'core', message: 'Requires a newer launcher' }],
        },
      }),
    )

    await page.goto(`/settings/bundles?selected=${name}`)

    await expect(page.getByText('Bundle has unresolved compatibility errors')).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText('core: Requires a newer launcher')).toBeVisible()
  })
})
