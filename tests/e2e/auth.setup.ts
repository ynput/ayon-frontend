import { expect, test as setup } from '@playwright/test'
import { AyonApi } from './support/api'
import { adminCredentials, AUTH_FILE } from './support/env'

// Log in once through the API and store the session for every other test.
// The login form itself is covered by auth/login.spec.ts.
setup('authenticate as admin', async ({ page, baseURL }) => {
  const { name, password } = adminCredentials()
  const { api, token, user } = await AyonApi.login(baseURL!, name, password)
  await api.dispose()
  expect(user.data.isAdmin, `${name} must be an admin to run the e2e suite`).toBeTruthy()

  await page.goto('/login')
  await page.evaluate((t) => localStorage.setItem('accessToken', t), token)
  await page.context().addCookies([{ name: 'accessToken', value: token, url: baseURL! }])
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible({ timeout: 30_000 })

  await page.context().storageState({ path: AUTH_FILE })
})
