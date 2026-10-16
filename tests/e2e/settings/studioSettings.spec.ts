import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'

const variantButton = (page: Page, variant: 'Production' | 'Staging') =>
  page.getByRole('button', { name: variant, exact: true })

// FLAG: the selected variant is only shown by the button's highlight colour
const expectVariant = async (page: Page, variant: 'Production' | 'Staging') =>
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
})
