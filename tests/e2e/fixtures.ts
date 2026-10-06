import { test as base, expect } from '@playwright/test'
import { AyonApi } from './support/api'
import { adminCredentials } from './support/env'
import { uniqueName } from './support/names'

type WorkerFixtures = {
  /** Admin REST client, shared by all tests in a worker */
  api: AyonApi
}

type TestFixtures = {
  /**
   * A fresh, empty project (default anatomy) owned by this test.
   * Created through the API before the test and deleted after it, so tests never share data.
   */
  projectName: string
  /** Users created through `createUser` are deleted after the test */
  createUser: AyonApi['createUser']
  accessGroup: string
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  api: [
    async ({}, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL!
      const { name, password } = adminCredentials()
      const { api } = await AyonApi.login(baseURL, name, password)
      await use(api)
      await api.dispose()
    },
    { scope: 'worker' },
  ],

  projectName: async ({ api, context }, use) => {
    const name = await api.createProject()
    await use(name)
    // Fixtures tear down in reverse order, so the page would still be open (and querying the project)
    // while it is deleted. Dropping a project schema under open queries blocks the database for
    // every other test, so close the pages first.
    await Promise.all(context.pages().map((p) => p.close()))
    await api.deleteProject(name)
  },

  createUser: async ({ api }, use) => {
    const created: string[] = []
    await use(async (options) => {
      const user = await api.createUser(options)
      created.push(user.name)
      return user
    })
    for (const name of created) await api.deleteUser(name)
  },

  accessGroup: async ({ api }, use) => {
    const name = uniqueName('ag')
    await api.createAccessGroup(name)
    await use(name)
    await api.deleteAccessGroup(name)
  },

  page: async ({ page }, use) => {
    // keep one-off prompts from covering the app; each key is what the prompt itself sets when dismissed
    await page.addInitScript(() => {
      try {
        // "Complete your profile" dialog on /dashboard (src/components/CompleteProfilePrompt)
        localStorage.setItem('ayon-email-prompt-dismissed', 'true')
        // server restart banner (src/context/RestartContext.jsx)
        localStorage.setItem('restart-snooze', JSON.stringify('2099-01-01T00:00:00.000Z'))
        // "Setup pipeline" release installer prompt in the header
        sessionStorage.setItem('releaseInstallPrompt', 'false')
      } catch {
        // storage is unavailable on about:blank
      }
    })
    // changelog / survey popups
    await page.route(/featurebase\.app/, (route) => route.abort())
    await use(page)
  },
})

export { expect }
