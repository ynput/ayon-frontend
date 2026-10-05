import { Locator, Page } from '@playwright/test'
import { expect, test as base } from '../fixtures'
import { AyonApi, Folder, Product, Task, Version } from '../support/api'
import { adminCredentials } from '../support/env'
import { uniqueName } from '../support/names'
import { Noise, watchPageHealth } from '../support/pageHealth'

/** What the smoke tests open: one project with one of each core entity */
export type SmokeData = {
  projectName: string
  folder: Folder
  /** assigned to the admin, so it shows on the admin's dashboard */
  task: Task
  product: Product
  /** v001 of `product`, published from `task` */
  version: Version
  /** a generic task list that contains `task` */
  list: { id: string; label: string }
  /** an empty review session (a `review-session` version list, as "add" on the review page creates it) */
  reviewSession: { id: string; label: string }
}

/**
 * One route of the app.
 * `ready` waits for the page's own "ready" signal (a heading, table or key control),
 * the page health check runs after it.
 */
export type SmokeRoute = {
  /** test title, names the page */
  name: string
  path: (data: SmokeData) => string
  ready: (page: Page, data: SmokeData) => Promise<void>
  /** expected noise of this page only, each with a FLAG comment */
  allow?: Noise[]
  /** FLAG: a known bug of this page; the test is `test.fixme` until it is fixed */
  fixme?: string
  /**
   * A reason to skip the page on this server (e.g. it needs internet or an addon), or false.
   * Runs before the page is opened and may use the test's page.
   */
  skip?: (context: { api: AyonApi; data: SmokeData; page: Page }) => Promise<string | false>
}

export const test = base.extend<{}, { smoke: SmokeData }>({
  /**
   * The smoke tests only read, so the tests of a worker share one seeded project instead of each
   * creating and dropping its own (dozens of schema create/drops stall the backend, see tests/AGENTS.md).
   * It is dropped when the worker ends; the global teardown sweeps it after a crash.
   */
  smoke: [
    async ({ api }, use) => {
      const projectName = await api.createProject()
      try {
        const folder = await api.createFolder(projectName, {
          name: uniqueName('sq'),
          folderType: 'Sequence',
        })
        const task = await api.createTask(projectName, {
          folderId: folder.id,
          name: uniqueName('task'),
          assignees: [adminCredentials().name],
        })
        const product = await api.createProduct(projectName, { folderId: folder.id })
        const version = await api.createVersion(projectName, {
          productId: product.id,
          taskId: task.id,
        })
        const label = uniqueName('list')
        const listId = await api.createEntityList(projectName, { label, entityType: 'task' })
        await api.addEntityListItem(projectName, listId, task.id)
        const sessionLabel = uniqueName('review')
        const sessionId = await api.createEntityList(projectName, {
          label: sessionLabel,
          entityType: 'version',
          entityListType: 'review-session',
        })

        await use({
          projectName,
          folder,
          task,
          product,
          version,
          list: { id: listId, label },
          reviewSession: { id: sessionId, label: sessionLabel },
        })
      } finally {
        await api.deleteProject(projectName)
      }
    },
    { scope: 'worker', timeout: 120_000 },
  ],
})

/** Names of the addons in the production bundle */
export const productionAddons = async (api: AyonApi): Promise<string[]> => {
  const {
    bundles,
  }: { bundles: { isProduction: boolean; addons: Record<string, string | null> }[] } =
    await api.get('/api/bundles', { archived: false })
  const production = bundles.find((b) => b.isProduction)
  return Object.entries(production?.addons ?? {})
    .filter(([, version]) => !!version)
    .map(([name]) => name)
}

// locators shared by the route tables
export const heading = (page: Page, name: string | RegExp) => page.getByRole('heading', { name })
export const column = (page: Page, name: string) =>
  page.getByRole('columnheader', { name, exact: true }).first()
export const button = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name }).first()

/** Waits for each locator, with the longer timeout the first load of a page needs on a busy server */
export const visible = async (...locators: Locator[]) => {
  for (const locator of locators) await expect(locator).toBeVisible({ timeout: 30_000 })
}

/** One `test()` per route, so a failure names the page */
export const defineRouteTests = (routes: SmokeRoute[]) => {
  for (const route of routes) {
    const body = async ({ page, smoke, api }: { page: Page; smoke: SmokeData; api: AyonApi }) => {
      const skip = route.skip && (await route.skip({ api, data: smoke, page }))
      test.skip(!!skip, skip || '')
      const health = watchPageHealth(page, { allow: route.allow })
      await page.goto(route.path(smoke))
      try {
        await route.ready(page, smoke)
      } catch (error) {
        // a page that never gets ready has usually crashed: fail with what went wrong instead
        await health.expectHealthy({ settle: false })
        throw error
      }
      await health.expectHealthy()
    }
    if (route.fixme) {
      test.fixme(route.name, { annotation: { type: 'issue', description: route.fixme } }, body)
    } else {
      test(route.name, body)
    }
  }
}

export { expect }
