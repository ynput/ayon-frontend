import { expect, test } from '../fixtures'
import { expectRowSelection, menuItem } from '../support/ui'

test.describe('addons manager', () => {
  test('the menu of an addon that is not selected acts on that addon', async ({ page, api }) => {
    const { addons } = await api.get('/api/addons')
    test.skip(addons.length < 2, 'needs two installed addons')
    const [selectedName, otherName] = addons.map((a: any) => a.name)
    await page.goto('/settings/addons')
    const addonRow = (name: string) =>
      page.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) })
    const selected = addonRow(selectedName)
    const other = addonRow(otherName)
    await selected.click()
    await expectRowSelection([selected])

    await other.click({ button: 'right' })

    await expect(menuItem(page, 'View in Market')).toBeVisible()
    await expectRowSelection([selected], [other])
    await menuItem(page, 'View in Market').click()
    await expect(page).toHaveURL(new RegExp(`/market\\?selected=${otherName}$`))
  })
})
