import { Browser, expect, request, TestInfo } from '@playwright/test'
import { ApiError, AyonApi } from './api'
import { LoginPage } from '../pages/LoginPage'

const NO_SESSION = { cookies: [], origins: [] }

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

// not AyonApi.login: in a test, request.newContext() inherits the admin cookie, which beats the Bearer token
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
