import { expect, test } from '../fixtures'
import { LoginPage } from '../pages/LoginPage'

// these tests sign in themselves, and signing out must never invalidate the shared admin session
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('login', () => {
  test('a user can log in with their password and sign out again', async ({ page, createUser }) => {
    const user = await createUser({ fullName: 'Login Tester' })
    const login = new LoginPage(page)

    await login.goto()
    await login.login(user.name, user.password)

    await expect(page).toHaveURL(/\/dashboard\/tasks/)
    await expect(login.userMenuButton).toBeVisible()

    await login.signOut()
    await expect(page).toHaveURL(/\/login/)
    await expect(login.usernameInput).toBeVisible()

    // the session is really gone, not just hidden
    await page.goto('/dashboard/tasks')
    await expect(login.usernameInput).toBeVisible()
  })

  test('a wrong password shows an error and keeps the user on the login page', async ({
    page,
    createUser,
  }) => {
    const user = await createUser()
    const login = new LoginPage(page)

    await login.goto()
    await login.login(user.name, 'definitely-not-the-password')

    await expect(
      page.getByRole('alert').filter({ hasText: /invalid|incorrect|password/i }),
    ).toBeVisible()
    await expect(login.usernameInput).toBeVisible()
    await expect(login.userMenuButton).toBeHidden()
  })

  test('submitting an empty form asks for credentials', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.submitButton.click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Please enter username and password to login' }),
    ).toBeVisible()
  })

  test('opening a deep link while signed out returns there after login', async ({
    page,
    api,
    projectName,
    createUser,
  }) => {
    const user = await createUser({ isAdmin: true })
    await api.createFolder(projectName, { name: 'deep_link_folder' })
    const login = new LoginPage(page)

    await page.goto(`/projects/${projectName}/overview`)
    await expect(login.usernameInput).toBeVisible()
    await login.login(user.name, user.password)

    await expect(page).toHaveURL(new RegExp(`/projects/${projectName}/overview`))
  })
})
