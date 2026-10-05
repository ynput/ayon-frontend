import { expect, test } from '../fixtures'
import { AccessGroupsPage } from '../pages/AccessGroupsPage'
import { uniqueName } from '../support/names'
import { confirmDialog, dialog, menuItem } from '../support/ui'

test.describe('access groups', () => {
  test('create an access group', async ({ page, api }) => {
    const name = uniqueName('ag')
    try {
      await page.goto('/settings/accessGroups')
      await page.getByRole('button', { name: 'New access group' }).click()
      const newGroup = dialog(page, 'New access group')
      await expect(newGroup).toBeVisible()
      // FLAG: the "Access group name" label is not associated with its input; it is the autofocused field
      await newGroup.locator('input:focus').fill(name)
      await newGroup.getByRole('button', { name: 'Create access group' }).click()

      await expect(newGroup).toBeHidden()
      await expect(page.getByRole('row', { name: name })).toBeVisible()
      await expect.poll(() => api.listAccessGroupNames()).toContain(name)
    } finally {
      await api.deleteAccessGroup(name)
    }
  })

  test('delete an access group', async ({ page, api }) => {
    const name = uniqueName('ag')
    await api.createAccessGroup(name)
    try {
      await page.goto('/settings/accessGroups')
      const row = page.getByRole('row', { name: name })
      await row.click({ button: 'right' })
      await menuItem(page, 'Delete').click()
      await confirmDialog(page).getByRole('button', { name: 'Delete' }).click()

      await expect(row).toBeHidden()
      await expect.poll(() => api.listAccessGroupNames()).not.toContain(name)
    } finally {
      await api.deleteAccessGroup(name)
    }
  })

  test('restrict folder creation for an access group', async ({ page, api, accessGroup }) => {
    const groups = new AccessGroupsPage(page)
    await groups.goto()
    await groups.select(accessGroup)

    await groups.setRestriction('Restrict folder creation', true)
    await groups.save()

    await expect.poll(async () => (await api.getAccessGroup(accessGroup)).create.enabled).toBe(true)
    // only that restriction changed
    const permissions = await api.getAccessGroup(accessGroup)
    expect(permissions.read.enabled).toBe(false)
    expect(permissions.update.enabled).toBe(false)

    // the saved state is shown after a reload
    await groups.goto()
    await groups.select(accessGroup)
    await expect(groups.restrictionCheckbox('Restrict folder creation')).toBeChecked()
  })
})
