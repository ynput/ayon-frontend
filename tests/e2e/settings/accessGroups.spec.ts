import { expect, test } from '../fixtures'
import { assigned, hierarchy, onlyFolders } from '../permissions/restrictedUser'
import { AccessGroupsPage } from '../pages/AccessGroupsPage'
import { confirmDialog, dialog, menuItem, uniqueName } from '@ynput/ayon-e2e'

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

  test('duplicate an access group with its permissions', async ({ page, api, accessGroup }) => {
    await api.createAccessGroup(accessGroup, {
      create: onlyFolders(assigned()),
      read: onlyFolders(hierarchy('/gs_animation')),
    })
    const copy = `${accessGroup}_copy`
    try {
      const groups = new AccessGroupsPage(page)
      await groups.goto()

      await groups.row(accessGroup).click({ button: 'right' })
      await menuItem(page, 'Duplicate').click()

      const duplicate = dialog(page, 'Duplicate access group')
      await expect(duplicate).toBeVisible()
      // FLAG: the "Access group name" label is not associated with its input; it is the autofocused field
      await expect(duplicate.locator('input:focus')).toHaveValue(copy)
      await duplicate.getByRole('button', { name: 'Duplicate access group' }).click()

      await expect(duplicate).toBeHidden()
      await groups.expectSelected(copy)
      await expect.poll(() => api.listAccessGroupNames()).toContain(copy)
      const original = await api.getAccessGroup(accessGroup)
      expect(await api.getAccessGroup(copy)).toEqual(original)
    } finally {
      await api.deleteAccessGroup(copy)
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

  test('an assigned folder entry does not show the path of the previously selected group', async ({
    page,
    api,
    accessGroup,
  }) => {
    const other = uniqueName('ag')
    // one entry in each group: the editor reuses the entry's inputs when the entry counts match
    await api.createAccessGroup(accessGroup, { read: onlyFolders(assigned()) })
    await api.createAccessGroup(other, { read: onlyFolders(hierarchy('/gs_animation')) })
    try {
      const groups = new AccessGroupsPage(page)
      const path = groups.editor.textbox('root_read_access_list_0_path')
      await groups.goto()
      await groups.select(other)
      await groups.editor.expand('Restrict folder read')
      await expect(path).toHaveValue('/gs_animation')

      await groups.select(accessGroup)
      await groups.editor.expand('Restrict folder read')
      await expect(path).toHaveValue('')
    } finally {
      await api.deleteAccessGroup(other)
    }
  })
})
