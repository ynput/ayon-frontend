import { expect, test } from '../fixtures'
import { dialog, expectRowSelection, menuItem } from '../support/ui'

test.describe('addon settings', () => {
  test('the addon list menu opens its dialogs for the right-clicked addon', async ({
    page,
    api,
  }) => {
    await page.goto('/settings/studio')
    const list = page.locator('.addon-list-table')
    await expect(list).not.toHaveClass(/\bloading\b/)
    const rows = await list
      .locator('tbody tr')
      .evaluateAll((trs) =>
        trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent!.trim())),
      )
    test.skip(rows.length < 2, 'the production bundle needs two addons with settings')
    const [[selectedTitle], [otherTitle, otherVersion]] = rows
    const { addons } = await api.get('/api/addons')
    const otherName = addons.find((a: any) => a.title === otherTitle).name
    const addonRow = (title: string) =>
      list.getByRole('row').filter({ has: page.getByRole('cell', { name: title, exact: true }) })
    const selected = addonRow(selectedTitle)
    const other = addonRow(otherTitle)

    // the dialogs read the selection, so opening one selects the right-clicked addon
    await selected.click()
    await other.click({ button: 'right' })
    await expect(menuItem(page, 'Low-level editor')).toBeVisible()
    await expectRowSelection([selected], [other])
    await menuItem(page, 'Low-level editor').click()

    const rawEditor = dialog(page, `${otherName} ${otherVersion} production raw settings`)
    await expect(rawEditor).toBeVisible()
    await rawEditor.getByRole('button', { name: 'close', exact: true }).click()
    await expect(rawEditor).toBeHidden()
    await expectRowSelection([other], [selected])

    await selected.click()
    await expectRowSelection([selected], [other])
    await other.click({ button: 'right' })
    await expect(menuItem(page, 'Copy settings from...')).toBeVisible()
    await expectRowSelection([selected], [other])
    await menuItem(page, 'Copy settings from...').click()

    const copySettings = dialog(page, 'Copy production settings from...')
    await expect(copySettings).toContainText(`${otherTitle} ${otherVersion}`)
    await expect(copySettings).not.toContainText(selectedTitle)
    await copySettings.getByRole('button', { name: 'close', exact: true }).click()
    await expect(copySettings).toBeHidden()
    await expectRowSelection([other], [selected])
  })
})
