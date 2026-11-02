import { expect, Page } from '@playwright/test'
import { dialog, menuItem, toast, uniqueName } from '@ynput/ayon-e2e'
import { test } from '../fixtures'
import { MEDIA } from '../media'
import { OverviewPage } from '../pages/OverviewPage'
import { AyonApi } from '../support/api'

// Publishes on two products, so the server has two latest versions for this folder or task.
// The session must only get the newer one.
const publishTwoProducts = async (
  api: AyonApi,
  projectName: string,
  folderId: string,
  taskId?: string,
) => {
  const publish = async (type: string) => {
    const name = `${type}${taskId ? taskId.slice(0, 6) : ''}`
    const product = await api.createProduct(projectName, { folderId, name })
    const version = await api.createVersion(projectName, { productId: product.id, taskId })
    await api.uploadReviewable(projectName, version.id, MEDIA.stillImage.path)
    return version
  }
  await publish('plateMain')
  return publish('renderMain')
}

// sh010 and sh020 have reviewables on two products each, sh030 has none
const seedFolders = async (api: AyonApi, projectName: string) => {
  const newest = []
  for (const name of ['sh010', 'sh020']) {
    const { id } = await api.createFolder(projectName, { name, folderType: 'Shot' })
    newest.push(await publishTwoProducts(api, projectName, id))
  }
  await api.createFolder(projectName, { name: 'sh030', folderType: 'Shot' })
  return newest.map((version) => version.id)
}

const openReviewMenu = async (page: Page, projectName: string, item: string) => {
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.selectRow('sh010')
  await overview.addRowToSelection('sh020')
  await overview.addRowToSelection('sh030')
  await overview.nameCell('sh030').click({ button: 'right' })
  await menuItem(page, 'Review').hover()
  await menuItem(page, item).click()
}

const createSession = async (page: Page, label: string) => {
  const newSession = dialog(page, 'Create Review Session')
  await newSession.getByLabel('Session label').fill(label)
  await newSession.getByRole('button', { name: 'Create session' }).click()
  await expect(toast(page, `Review session ${label} created`)).toBeVisible()
}

const sessionVersionIds = async (api: AyonApi, projectName: string, label: string) => {
  const lists = await api.listEntityLists(projectName)
  const session = await api.getEntityList(projectName, lists.find((l) => l.label === label)!.id)
  expect(session.entityType).toBe('version')
  expect(session.entityListType).toBe('review-session')
  return session.items.map((item) => item.entityId)
}

test.describe('review sessions from folders and tasks', () => {
  test.beforeEach(async ({ api }) => {
    const { addons } = await api.get('/api/addons')
    const review = addons.find((addon: { name: string }) => addon.name === 'review')
    test.skip(!review?.productionVersion, 'needs the review addon in the production bundle')
  })

  test('a new session gets one version per selected folder', async ({
    page,
    api,
    projectName,
  }) => {
    const newest = await seedFolders(api, projectName)
    const label = uniqueName('session')

    await openReviewMenu(page, projectName, 'Create new session')
    await createSession(page, label)

    await expect(toast(page, '1 folder skipped (no reviewables)')).toBeVisible()
    expect(await sessionVersionIds(api, projectName, label)).toEqual(newest)
  })

  test('adding to a session adds one version per selected folder', async ({
    page,
    api,
    projectName,
  }) => {
    const newest = await seedFolders(api, projectName)
    const label = uniqueName('session')
    const listId = await api.createEntityList(projectName, {
      label,
      entityType: 'version',
      entityListType: 'review-session',
    })

    await openReviewMenu(page, projectName, 'Add to review list')

    const addTo = dialog(page, 'Add to review list')
    await addTo.getByText(label, { exact: true }).click()
    await addTo.getByRole('button', { name: 'Add to list' }).click()
    await expect(toast(page, 'Items added to session')).toBeVisible()

    const session = await api.getEntityList(projectName, listId)
    expect(session.items.map((item) => item.entityId)).toEqual(newest)
  })

  test('a new session gets one version per selected task', async ({ page, api, projectName }) => {
    const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const newest = []
    for (const name of ['anim', 'lighting']) {
      const task = await api.createTask(projectName, { folderId: shot.id, name })
      const version = await publishTwoProducts(api, projectName, shot.id, task.id)
      newest.push(version.id)
    }
    const label = uniqueName('session')

    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')
    await overview.selectRow('anim')
    await overview.addRowToSelection('lighting')
    await overview.nameCell('lighting').click({ button: 'right' })
    await menuItem(page, 'Review').hover()
    await menuItem(page, 'Create new session').click()
    await createSession(page, label)

    expect(await sessionVersionIds(api, projectName, label)).toEqual(newest)
  })
})
