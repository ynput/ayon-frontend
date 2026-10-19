import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { LoginPage } from '../pages/LoginPage'

type Variant = 'Production' | 'Staging' | 'Dev'

const variantButton = (page: Page, variant: Variant) =>
  page.getByRole('button', { name: variant, exact: true })

// FLAG: the selected variant is only shown by the button's highlight colour
const expectVariant = async (page: Page, variant: Variant) =>
  expect(variantButton(page, variant)).toHaveAttribute(
    'style',
    new RegExp(`--color-hl-${variant.toLowerCase()}`),
  )

test.describe('studio settings', () => {
  test('the chosen variant is kept per tab and after leaving the page', async ({
    page,
    context,
  }) => {
    await page.goto('/settings/studio')
    await expect(variantButton(page, 'Staging')).toBeVisible({ timeout: 30_000 })
    const otherTab = await context.newPage()
    try {
      await otherTab.goto('/settings/studio')
      await expectVariant(otherTab, 'Production')

      await variantButton(page, 'Staging').click()
      await expectVariant(page, 'Staging')

      await page.goto('/projects')
      await page.goBack()
      await expectVariant(page, 'Staging')
      await otherTab.reload()
      await expectVariant(otherTab, 'Production')
    } finally {
      await otherTab.close()
    }
  })

  test.describe('as a developer', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('the developer mode switch opens the dev bundle and goes back to production', async ({
      page,
      api,
      createUser,
    }) => {
      const user = await createUser({ isAdmin: true })
      await api.patch(`/api/users/${user.name}`, { data: { isAdmin: true, isDeveloper: true } })
      const bundle = `e2e_dev_${Date.now()}`
      await api.post('/api/bundles', {
        name: bundle,
        isDev: true,
        activeUser: user.name,
        addons: {},
      })
      try {
        const login = new LoginPage(page)
        await login.goto()
        await login.login(user.name, user.password)
        await expect(login.userMenuButton).toBeVisible({ timeout: 20_000 })
        await page.goto('/settings/studio')
        await variantButton(page, 'Staging').click()
        await expectVariant(page, 'Staging')

        const developerSwitch = page.getByText('Developer Mode', { exact: true })
        await developerSwitch.click()
        await expectVariant(page, 'Dev')
        await expect(page.getByText(bundle).first()).toBeVisible()

        await page.goto('/projects')
        await page.goBack()
        await expectVariant(page, 'Dev')

        await developerSwitch.click()
        await expectVariant(page, 'Production')
      } finally {
        await api.delete(`/api/bundles/${bundle}`)
      }
    })
  })
})
