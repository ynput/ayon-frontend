import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'

const marketAddon = (name: string, title: string, flags: string[]) => ({
  name,
  title,
  description: `${title} description`,
  orgName: 'ynput-official',
  orgTitle: 'Ynput',
  icon: null,
  tags: [],
  flags,
  latestVersion: '1.0.0',
  links: [],
  available: true,
  currentProductionVersion: null,
  currentLatestVersion: null,
  isOutdated: false,
})

const ADDONS = [
  marketAddon('e2e_studio_only', 'E2E Studio Only', ['licensed', 'studio-only']),
  marketAddon('e2e_power', 'E2E Power', ['licensed', 'power-feature']),
]

// the market comes from Ynput Cloud through the server, so the page gets fixed addons
const routeMarket = async (page: Page) => {
  await page.route('**/api/market/addons', (route) => route.fulfill({ json: { addons: ADDONS } }))
  await page.route('**/api/market/addons/*', (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop()
    const addon = ADDONS.find((a) => a.name === name)
    if (!addon) return route.fallback()
    return route.fulfill({ json: { ...addon, versions: [], warning: null } })
  })
}

test.describe('market', () => {
  test('a studio-only addon is not offered with a Pro subscription', async ({ page }) => {
    await routeMarket(page)

    await page.goto('/market?selected=e2e_studio_only')

    await expect(page.getByRole('heading', { name: 'E2E Studio Only', level: 2 })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText('Studio only', { exact: true })).toBeVisible()
    await expect(page.getByText('Pro', { exact: true })).toHaveCount(0)

    await page.getByText('E2E Power', { exact: true }).click()

    await expect(page.getByRole('heading', { name: 'E2E Power', level: 2 })).toBeVisible()
    await expect(page.getByText('Pro', { exact: true })).toBeVisible()
    await expect(page.getByText('Studio', { exact: true })).toBeVisible()
    await expect(page.getByText('Studio only', { exact: true })).toHaveCount(0)
  })
})
