import { expect, test } from '../fixtures'
import { uniqueName } from '../support/names'
import { UsersSettingsPage } from '../pages/UsersSettingsPage'
import { LoginPage } from '../pages/LoginPage'
import { apiAs, signInAs } from '../support/session'
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

  test('delete a user', async ({ page, api, createUser }) => {
    const { name } = await createUser()
    const users = new UsersSettingsPage(page)
    await users.goto()

    await users.deleteUser(name)

    await expect(users.row(name)).toBeHidden()
    await expect.poll(() => api.userExists(name)).toBe(false)
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
})
