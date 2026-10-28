import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { requireAddon } from '../support/addons'

// Bundles are studio wide, so the tests don't change them. The page alone sees the user in
// another bundle mode, two made up addons with a project page, and (for developer mode) a dev
// bundle. The addon modules are the server's real ones, the page only treats them as coming
// from the user's bundle.

type Mode = 'production' | 'staging' | 'developer'

const PROD_ONLY = { name: 'e2e_prod_only', title: 'E2E Prod Only' }
const BUNDLE_ONLY = { name: 'e2e_bundle_only', title: 'E2E Bundle Only' }

const fakeAddon = (
  addon: { name: string; title: string },
  versions: { productionVersion?: string; stagingVersion?: string },
) => ({
  name: addon.name,
  title: addon.title,
  description: '',
  addonType: 'server',
  ...versions,
  versions: { '1.0.0': { frontendScopes: { project: {} } } },
})

const isPath = (path: string) => (url: URL) => url.pathname === path

const openInBundleMode = async (
  page: Page,
  projectName: string,
  mode: Mode,
  devBundleOwner: 'me' | 'someone else' = 'me',
) => {
  let userName = ''

  await page.route(isPath('/api/info'), async (route) => {
    const response = await route.fetch()
    const info = await response.json()
    if (info.user) {
      userName = info.user.name
      info.user.attrib = { ...info.user.attrib, developerMode: mode === 'developer' }
      info.user.data = {
        ...info.user.data,
        frontendPreferences: {
          ...info.user.data?.frontendPreferences,
          stagingMode: mode === 'staging',
        },
      }
    }
    await route.fulfill({ response, json: info })
  })

  await page.route(isPath('/api/addons'), async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    const response = await route.fetch()
    const data = await response.json()
    data.addons = [
      ...data.addons,
      // removed from staging and dev, only in production
      fakeAddon(PROD_ONLY, { productionVersion: '1.0.0' }),
      // only in staging (and the dev bundle below)
      fakeAddon(BUNDLE_ONLY, { stagingVersion: '1.0.0' }),
    ]
    await route.fulfill({ response, json: data })
  })

  await page.route(isPath('/api/bundles'), async (route) => {
    if (route.request().method() !== 'GET') return route.continue()
    const response = await route.fetch()
    const data = await response.json()
    const production = data.bundles.find((b: { isProduction?: boolean }) => b.isProduction)
    const addons = { ...production?.addons, [BUNDLE_ONLY.name]: '1.0.0' }
    data.bundles = [
      ...data.bundles,
      {
        name: 'e2e_dev_bundle',
        addons,
        isDev: true,
        activeUser: devBundleOwner === 'me' ? userName : 'e2e_someone_else',
      },
    ]
    await route.fulfill({ response, json: data })
  })

  await page.goto(`/projects/${projectName}/overview`)
}

const navTab = (page: Page, name: string) => page.getByRole('link', { name, exact: true })
const bundleDot = (page: Page) => page.locator('nav [data-tooltip$=" bundle"]:visible')

test.describe('addons follow the user bundle', () => {
  test('production shows production addons without a bundle mark', async ({
    page,
    projectName,
    api,
  }) => {
    await requireAddon(api, 'planner')
    await openInBundleMode(page, projectName, 'production')

    await expect(navTab(page, PROD_ONLY.title)).toBeVisible()
    await expect(navTab(page, BUNDLE_ONLY.title)).toBeHidden()

    await navTab(page, 'Schedule').click()
    await expect(page).toHaveURL(/\/scheduler/)
    await expect(bundleDot(page)).toHaveCount(0)
  })

  test('staging hides addons removed from staging and marks staging addon pages', async ({
    page,
    projectName,
    api,
  }) => {
    const plannerVersion = await requireAddon(api, 'planner')
    await openInBundleMode(page, projectName, 'staging')

    await expect(navTab(page, BUNDLE_ONLY.title)).toBeVisible()
    await expect(navTab(page, PROD_ONLY.title)).toBeHidden()

    // only the selected tab is marked
    await expect(bundleDot(page)).toHaveCount(0)
    await navTab(page, 'Schedule').click()
    await expect(bundleDot(page)).toHaveAttribute(
      'data-tooltip',
      `Using planner ${plannerVersion} from the staging bundle`,
    )
  })

  test('developer mode uses the user own dev bundle', async ({ page, projectName, api }) => {
    const plannerVersion = await requireAddon(api, 'planner')
    await openInBundleMode(page, projectName, 'developer')

    await expect(navTab(page, BUNDLE_ONLY.title)).toBeVisible()
    await expect(navTab(page, PROD_ONLY.title)).toBeHidden()

    await navTab(page, 'Schedule').click()
    await expect(bundleDot(page)).toHaveAttribute(
      'data-tooltip',
      `Using planner ${plannerVersion} from the dev bundle`,
    )
  })

  test("developer mode ignores another user's dev bundle", async ({ page, projectName, api }) => {
    await requireAddon(api, 'planner')
    await openInBundleMode(page, projectName, 'developer', 'someone else')

    // the server sends production modules, so the page shows production
    await expect(navTab(page, PROD_ONLY.title)).toBeVisible()
    await expect(navTab(page, BUNDLE_ONLY.title)).toBeHidden()

    await navTab(page, 'Schedule').click()
    await expect(page).toHaveURL(/\/scheduler/)
    await expect(bundleDot(page)).toHaveCount(0)
  })
})
