import { expect, test } from '../fixtures'
import { uniqueName } from '../support/names'
import { UsersSettingsPage } from '../pages/UsersSettingsPage'
import { LoginPage } from '../pages/LoginPage'

test.describe('users settings', () => {
  test('create a user who can then log in', async ({ page, api, browser }) => {
    const name = uniqueName('newuser')
    const password = `Pw-${Math.random().toString(36).slice(2)}`
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
})
