import { Browser, BrowserContext, expect, Page, test } from '@playwright/test'
import { AyonApi, login } from './api'
import { addonDev } from './env'

const NO_SESSION = { cookies: [], origins: [] }

/**
 * Keeps AYON's one-off prompts from covering the app, and in an addon's suite loads the addon from
 * its dev server. The `page` fixture and `signInAs` do this already; call it for pages or contexts
 * you create yourself.
 */
export const preparePages = async (target: Page | BrowserContext) => {
  await target.addInitScript((dev) => {
    try {
      // each key is what the prompt itself sets when dismissed
      // "Complete your profile" dialog on /dashboard (src/components/CompleteProfilePrompt)
      localStorage.setItem('ayon-email-prompt-dismissed', 'true')
      // server restart banner (src/context/RestartContext.jsx)
      localStorage.setItem('restart-snooze', JSON.stringify('2099-01-01T00:00:00.000Z'))
      // "Setup pipeline" release installer prompt in the header
      sessionStorage.setItem('releaseInstallPrompt', 'false')
      // what ?addonDev=<addon>@<url> stores (shared/src/context/remote-modules/addonDevOverride.ts)
      if (dev) localStorage.setItem('ayon-addon-dev', JSON.stringify(dev))
    } catch {
      // storage is unavailable on about:blank
    }
  }, addonDev() ?? null)
  // changelog / survey popups
  await target.route(/featurebase\.app/, (route) => route.abort())
}

/**
 * A browser context signed in as the user, through the API (the login form is AYON's to test).
 * Close it in a `finally`, or from a fixture.
 */
export const signedInContext = async (browser: Browser, name: string, password: string) => {
  const baseURL = test.info().project.use.baseURL!
  const { api, token } = await login(AyonApi, baseURL, name, password)
  await api.dispose()
  const context = await browser.newContext({ storageState: NO_SESSION })
  await context.addCookies([{ name: 'accessToken', value: token, url: baseURL }])
  await context.addInitScript((t) => {
    try {
      localStorage.setItem('accessToken', t)
    } catch {
      // about:blank
    }
  }, token)
  await preparePages(context)
  return context
}

/** A page signed in as another user, in its own context, opened on AYON's start page */
export const signInAs = async (browser: Browser, name: string, password: string) => {
  const context = await signedInContext(browser, name, password)
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible({ timeout: 30_000 })
  return { context, page }
}
