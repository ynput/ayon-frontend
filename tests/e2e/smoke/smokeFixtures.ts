import { Locator, Page } from '@playwright/test'
import { expect, test as base } from '../fixtures'
import { AyonApi, Folder, Product, Task, Version } from '../support/api'
import { adminCredentials } from '../support/env'
import { uniqueName } from '../support/names'
import { Noise, watchPageHealth } from '../support/pageHealth'

export type SmokeData = {
  projectName: string
  folder: Folder
  task: Task
  product: Product
  version: Version
  list: { id: string; label: string }
  reviewSession: { id: string; label: string }
}

export type SmokeRoute = {
  name: string
  path: (data: SmokeData) => string
  ready: (page: Page, data: SmokeData) => Promise<void>
  allow?: Noise[]
  fixme?: string
  skip?: (context: { api: AyonApi; data: SmokeData; page: Page }) => Promise<string | false>
}

export const test = base.extend<{}, { smoke: SmokeData }>({
  // one project per worker: the tests only read, and many project create/drops stall the backend
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

export const heading = (page: Page, name: string | RegExp) => page.getByRole('heading', { name })
export const column = (page: Page, name: string) =>
  page.getByRole('columnheader', { name, exact: true }).first()
export const button = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name }).first()

export const visible = async (...locators: Locator[]) => {
  for (const locator of locators) await expect(locator).toBeVisible({ timeout: 30_000 })
}

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
