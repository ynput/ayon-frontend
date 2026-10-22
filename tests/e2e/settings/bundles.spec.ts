import { expect, test } from '../fixtures'
import { expectRowSelection, menuItem } from '../support/ui'

test.describe('bundles', () => {
  test('duplicate a bundle that is not selected from its context menu', async ({ page, api }) => {
    const { bundles } = await api.get('/api/bundles')
    // the duplicate is named after its source, so the two names must not share a prefix
    const prefix = (name: string) => name.replace(/\d+$/, '')
    const names: string[] = bundles
      .filter((b: any) => !b.isArchived && !b.isDev && !b.isProject)
      .map((b: any) => b.name)
    const pair = names
      .flatMap((a) => names.map((b) => [a, b]))
      .find(([a, b]) => !prefix(a).startsWith(prefix(b)) && !prefix(b).startsWith(prefix(a)))
    test.skip(!pair, 'needs two bundles with different name prefixes')
    const [selectedName, otherName] = pair!

    await page.goto('/settings/bundles')
    const bundleRow = (name: string) =>
      page
        .locator('.bundles-table')
        .getByRole('row')
        .filter({ has: page.getByRole('cell', { name, exact: true }) })
    const selected = bundleRow(selectedName)
    const other = bundleRow(otherName)
    await selected.click()
    await expectRowSelection([selected])

    await other.click({ button: 'right' })

    await expect(menuItem(page, 'Duplicate and Edit')).toBeVisible()
    await expectRowSelection([selected], [other])
    await menuItem(page, 'Duplicate and Edit').click()
    const escaped = prefix(otherName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    await expect(page.getByLabel('Bundle name')).toHaveValue(new RegExp(`^${escaped}\\d+$`))
  })
})
