import { expect, test } from '../fixtures'
import { signInAs, uniqueName } from '@ynput/ayon-e2e'
import { apiAs } from '../support/api'
import { UsersSettingsPage } from '../pages/UsersSettingsPage'
import { LoginPage } from '../pages/LoginPage'
import { randomBytes } from 'crypto'

test.describe('users settings', () => {
  test('create a user who can then log in', async ({ page, api, browser }) => {
    const name = uniqueName('newuser')
    const password = `Pw-${randomBytes(12).toString('base64url')}`
    try {
      const users = new UsersSettingsPage(page)
      await users.goto()
      await users.createUser({ name, password })

      await users.filter(name)
      await expect(users.row(name)).toBeVisible()
      const user = await api.getUser(name)
      expect(user.data.isAdmin).toBeFalsy()
      expect(user.active).toBe(true)

      // the password set in the dialog works
      const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      const login = new LoginPage(await context.newPage())
      await login.goto()
      await login.login(name, password)
      await expect(login.userMenuButton).toBeVisible()
      await context.close()
    } finally {
      await api.deleteUser(name)
    }
  })

  test('delete a user that is not selected from its context menu', async ({
    page,
    api,
    createUser,
  }) => {
    const keep = await createUser()
    const target = await createUser()
    const users = new UsersSettingsPage(page)
    await users.goto()
    await users.select(keep.name)

    await users.openContextMenu(target.name)

    await users.expectSelected(keep.name)
    await users.expectSelected(target.name, false)

    await users.deleteUserFromMenu(target.name)

    await expect(users.row(target.name)).toBeHidden()
    await expect(users.row(keep.name)).toBeVisible()
    await expect.poll(() => api.userExists(target.name)).toBe(false)
    expect(await api.userExists(keep.name)).toBe(true)
  })

  test('delete several users at once', async ({ page, api, createUser }) => {
    const first = await createUser()
    const second = await createUser()
    const keep = await createUser()
    const users = new UsersSettingsPage(page)
    await users.goto()

    await users.select(first.name)
    await users.addToSelection(second.name)
    await users.deleteSelectedUsers(second.name, 2)

    await expect(users.row(first.name)).toBeHidden()
    await expect(users.row(second.name)).toBeHidden()
    await expect(users.row(keep.name)).toBeVisible()
    await expect.poll(() => api.userExists(first.name)).toBe(false)
    await expect.poll(() => api.userExists(second.name)).toBe(false)
    expect(await api.userExists(keep.name)).toBe(true)
  })

  test('set a password from the context menu of a user that is not selected', async ({
    page,
    browser,
    createUser,
  }) => {
    const selectedA = await createUser()
    const selectedB = await createUser()
    const target = await createUser()
    const newPassword = `pw_${randomBytes(12).toString('hex')}A1!`
    const users = new UsersSettingsPage(page)
    await users.goto()
    await users.select(selectedA.name)
    await users.addToSelection(selectedB.name)

    await users.openContextMenu(target.name)

    await users.expectSelected(selectedA.name)
    await users.expectSelected(selectedB.name)
    await users.expectSelected(target.name, false)

    await users.setPasswordFromMenu(target.name, newPassword)

    await users.expectSelected(target.name)
    await users.expectSelected(selectedA.name, false)
    await users.expectSelected(selectedB.name, false)

    const { context } = await signInAs(browser, target.name, newPassword)
    await context.close()
    for (const user of [selectedA, selectedB]) {
      const userApi = await apiAs(test.info(), user.name, user.password)
      try {
        expect((await userApi.get('/api/users/me')).name).toBe(user.name)
      } finally {
        await userApi.dispose()
      }
    }
  })

  test('a deactivated user can no longer log in', async ({ page, api, browser, createUser }) => {
    const user = await createUser()
    const users = new UsersSettingsPage(page)
    await users.goto()
    await users.select(user.name)

    await users.setActive(false)
    await users.save()

    await expect.poll(async () => (await api.getUser(user.name)).active).toBe(false)
    await expect(users.activeRow.getByRole('checkbox')).not.toBeChecked()

    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    try {
      const login = new LoginPage(await context.newPage())
      await login.goto()
      await login.login(user.name, user.password)
      await expect(
        login.page.getByRole('alert').filter({ hasText: 'User is not active' }),
      ).toBeVisible()
      await expect(login.userMenuButton).toBeHidden()
    } finally {
      await context.close()
    }
  })

  test('promote a user to manager', async ({ page, api, createUser }) => {
    const user = await createUser()
    const users = new UsersSettingsPage(page)
    await users.goto()
    await users.select(user.name)

    await users.setAccessLevel('Manager')
    await users.save()

    await expect.poll(async () => (await api.getUser(user.name)).data.isManager).toBe(true)
    expect((await api.getUser(user.name)).data.isAdmin).toBeFalsy()
    await expect(users.row(user.name)).toContainText('Manager')
  })

  test('typing in the filter keeps unsaved changes in the user panel', async ({
    page,
    createUser,
  }) => {
    const user = await createUser()
    const users = new UsersSettingsPage(page)
    await users.goto()
    await users.select(user.name)
    await users.setActive(false)

    await users.filter(user.name)
    await expect(users.row(user.name)).toBeVisible()
    await expect(users.activeRow.getByRole('checkbox')).not.toBeChecked()
  })

  test.describe('with thousands of users', () => {
    const COUNT = 3000
    const bulkName = (i: number) => `bulk_${String(i).padStart(4, '0')}`
    const last = bulkName(COUNT - 1)

    test.beforeEach(async ({ page }) => {
      // the real users plus mocked ones: creating this many would take minutes
      let bulk = Array.from({ length: COUNT }, (_, i) => ({
        node: {
          name: bulkName(i),
          active: true,
          accessGroups: '{}',
          defaultAccessGroups: [],
          allAttrib: JSON.stringify({ fullName: `Bulk ${i}`, email: `${bulkName(i)}@example.com` }),
        },
      }))
      await page.route('**/graphql', async (route) => {
        if (!/query UserList\s*\{/.test(route.request().postData() ?? '')) return route.continue()
        const response = await route.fetch()
        const json = await response.json()
        json.data.users.edges.push(...bulk)
        await route.fulfill({ response, json })
      })
      // deleting a mocked user only removes it from the mocked list
      await page.route('**/api/users/bulk_*', (route) => {
        if (route.request().method() !== 'DELETE') return route.continue()
        const name = new URL(route.request().url()).pathname.split('/').pop()
        bulk = bulk.filter((edge) => edge.node.name !== name)
        return route.fulfill({ status: 204 })
      })
    })

    test('filter, scroll and shift select', async ({ page }) => {
      const users = new UsersSettingsPage(page)
      await users.goto({ filter: '' })
      await expect(users.row(bulkName(0))).toBeVisible()
      const input = page.getByPlaceholder('Filter users...')

      // every typed character is kept, and the list follows
      await input.click()
      await page.keyboard.type('bulk_029', { delay: 30 })
      await expect(input).toHaveValue('bulk_029')
      await expect(page).toHaveURL(/search-users=bulk_029/)
      await expect(users.row(bulkName(290))).toBeVisible()
      await expect(page.getByRole('row').filter({ hasText: 'bulk_' })).toHaveCount(10)

      // after clearing, the list scrolls to the end again
      await users.filter('')
      await users.row(bulkName(1)).click()
      await expect(async () => {
        await page.getByRole('row').filter({ hasText: 'bulk_' }).first().hover()
        await page.mouse.wheel(0, 50_000)
        await expect(users.row(last)).toBeVisible({ timeout: 500 })
      }).toPass()

      // a shift click selects past the rendered rows, and the selection survives filtering
      await users.row(last).click({ modifiers: ['Shift'] })
      await expect(page.getByText(`${COUNT - 1} Users Selected`)).toBeVisible()
      await users.filter('bulk_029')
      await users.expectSelected(bulkName(290))
      await expect(page.getByText(`${COUNT - 1} Users Selected`)).toBeVisible()
    })

    test('deleting a user keeps the scroll position', async ({ page }) => {
      const users = new UsersSettingsPage(page)
      await users.goto({ filter: '' })
      await expect(users.row(bulkName(0))).toBeVisible()

      const target = bulkName(1500)
      await expect(async () => {
        await page.getByRole('row').filter({ hasText: 'bulk_' }).first().hover()
        await page.mouse.wheel(0, 2_000)
        await expect(users.row(target)).toBeVisible({ timeout: 300 })
      }).toPass()

      const reloaded = page.waitForResponse((response) =>
        /query UserList\s*\{/.test(response.request().postData() ?? ''),
      )
      await users.openContextMenu(target)
      await users.deleteUserFromMenu(target)
      await reloaded

      await expect(users.row(target)).toBeHidden()
      await expect(users.row(bulkName(1499))).toBeVisible()
      await expect(users.row(bulkName(0))).toBeHidden()
    })
  })
})
