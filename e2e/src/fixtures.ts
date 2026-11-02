import { test as base } from '@playwright/test'
import { ApiClass, AyonApi, login } from './api'
import { adminCredentials } from './env'
import { uniqueName } from './names'
import { preparePages } from './session'

export type AyonWorkerFixtures<T extends AyonApi> = {
  /** Admin REST client, shared by all tests in a worker */
  api: T
}

export type AyonTestFixtures<T extends AyonApi> = {
  /**
   * A fresh, empty project (default anatomy) owned by this test.
   * Created through the API before the test and deleted after it, so tests never share data.
   */
  projectName: string
  /** Users created through `createUser` are deleted after the test */
  createUser: T['createUser']
  /** A studio access group with default permissions, deleted after the test */
  accessGroup: string
}

/**
 * The test function with AYON's fixtures, its `api` an instance of `Client`: AyonApi, or a suite's
 * subclass with the endpoints of its own area. Extend it with the suite's own fixtures.
 */
export const ayonTest = <T extends AyonApi>(Client: ApiClass<T>) =>
  base.extend<AyonTestFixtures<T>, AyonWorkerFixtures<T>>({
    api: [
      async ({}, use, workerInfo) => {
        const { name, password } = adminCredentials()
        const { api } = await login(Client, workerInfo.project.use.baseURL!, name, password)
        await use(api)
        await api.dispose()
      },
      { scope: 'worker' },
    ],

    projectName: async ({ api, browser }, use) => {
      const name = await api.createProject()
      await use(name)
      // Fixtures tear down in reverse order, so a page could still be open (and querying the project)
      // while it is deleted. Dropping a project schema under open queries blocks the database for
      // every other test, so close the test's pages first (a worker runs one test at a time).
      await Promise.all(browser.contexts().flatMap((context) => context.pages().map((p) => p.close())))
      await api.deleteProject(name)
    },

    createUser: async ({ api }, use) => {
      const created: string[] = []
      await use((async (options) => {
        const user = await api.createUser(options)
        created.push(user.name)
        return user
      }) as T['createUser'])
      for (const name of created) await api.deleteUser(name)
    },

    accessGroup: async ({ api }, use) => {
      const name = uniqueName('ag')
      await api.createAccessGroup(name)
      await use(name)
      await api.deleteAccessGroup(name)
    },

    page: async ({ page }, use) => {
      await preparePages(page)
      await use(page)
    },
  })

export const test = ayonTest(AyonApi)
export { expect } from '@playwright/test'
