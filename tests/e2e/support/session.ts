import { Browser, expect, request, TestInfo } from '@playwright/test'
import { ApiError, AyonApi } from './api'
import { LoginPage } from '../pages/LoginPage'

/** Storage state without the admin session the chromium project starts with */
const NO_SESSION = { cookies: [], origins: [] }

/**
 * A separate browser session, signed in through the login form as another user.
 * Close the returned context when done (in a `finally`), the project fixture only closes the
 * pages of the default context.
 * Use it for anything that must not touch the admin account the suite runs as (profile, password)
 * or that depends on whose inbox/tasks are shown.
 */
export const signInAs = async (browser: Browser, name: string, password: string) => {
  const context = await browser.newContext({ storageState: NO_SESSION })
  const page = await context.newPage()
  await page.route(/featurebase\.app/, (route) => route.abort())
  const login = new LoginPage(page)
  await login.goto()
  await login.login(name, password)
  await expect(login.userMenuButton).toBeVisible()
  return { context, page }
}

/**
 * A REST client authorised as another user, e.g. to read that user's inbox. Dispose it when done.
 *
 * Not `AyonApi.login`: inside a test, `request.newContext()` inherits the project's `storageState`,
 * i.e. the admin's `accessToken` cookie, and the server prefers that cookie over the
 * Authorization header. A client made by `AyonApi.login` in a test is therefore always the admin.
 */
export const apiAs = async (testInfo: TestInfo, name: string, password: string) => {
  const baseURL = testInfo.project.use.baseURL!
  const anonymous = await request.newContext({ baseURL, storageState: NO_SESSION })
  try {
    const res = await anonymous.post('/api/auth/login', { data: { name, password } })
    if (!res.ok()) throw new ApiError('POST', '/api/auth/login', res.status(), await res.text())
    const { token } = await res.json()
    const ctx = await request.newContext({
      baseURL,
      storageState: NO_SESSION,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })
    return new AyonApi(ctx, token)
  } finally {
    await anonymous.dispose()
  }
}
