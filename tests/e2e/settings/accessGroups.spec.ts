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

  test('delete an access group that is not selected', async ({ page, api, accessGroup }) => {
    const name = uniqueName('ag')
    await api.createAccessGroup(name)
    try {
      const groups = new AccessGroupsPage(page)
      await groups.goto()
      await groups.select(accessGroup)

      await groups.row(name).click({ button: 'right' })

      await expect(menuItem(page, 'Delete')).toBeVisible()
      await groups.expectSelected(accessGroup)
      await groups.expectSelected(name, false)

      await menuItem(page, 'Delete').click()
      await confirmDialog(page).getByRole('button', { name: 'Delete' }).click()

      await expect(groups.row(name)).toBeHidden()
      await groups.expectSelected(accessGroup)
      await expect.poll(() => api.listAccessGroupNames()).not.toContain(name)
      expect(await api.listAccessGroupNames()).toContain(accessGroup)
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
    const permissions = await api.getAccessGroup(accessGroup)
    expect(permissions.read.enabled).toBe(false)
    expect(permissions.update.enabled).toBe(false)

    await groups.goto()
    await groups.select(accessGroup)
    await expect(groups.restrictionCheckbox('Restrict folder creation')).toBeChecked()
  })
})
