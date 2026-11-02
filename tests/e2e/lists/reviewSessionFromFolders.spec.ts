import { expect, Page } from '@playwright/test'
import { dialog, menuItem, toast, uniqueName } from '@ynput/ayon-e2e'
import { test } from '../fixtures'
import { MEDIA } from '../media'
import { OverviewPage } from '../pages/OverviewPage'
import { AyonApi } from '../support/api'

// A folder with reviewables on two products, and one with none. A session gets one version per
// selected folder, the newest published, and the folder with nothing to review is skipped.
const seed = async (api: AyonApi, projectName: string) => {
  const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  await api.createFolder(projectName, { name: 'sh020', folderType: 'Shot' })

  const publish = async (name: string) => {
    const product = await api.createProduct(projectName, { folderId: shot.id, name })
    const version = await api.createVersion(projectName, { productId: product.id, version: 1 })
    await api.uploadReviewable(projectName, version.id, MEDIA.stillImage.path)
    return version
  }
  await publish('plateMain')
  return publish('renderMain')
}

const openReviewMenu = async (page: Page, projectName: string, item: string) => {
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.selectRow('sh010')
  await overview.addRowToSelection('sh020')
  await overview.nameCell('sh020').click({ button: 'right' })
  await menuItem(page, 'Review').hover()
  await menuItem(page, item).click()
}

test.describe('review sessions from folders', () => {
  test.beforeEach(async ({ api }) => {
    const { addons } = await api.get('/api/addons')
    const review = addons.find((addon: { name: string }) => addon.name === 'review')
    test.skip(!review?.productionVersion, 'needs the review addon in the production bundle')
  })

  test('a new session gets the newest version of each selected folder', async ({
    page,
    api,
    projectName,
  }) => {
    const newest = await seed(api, projectName)
    const label = uniqueName('session')

    await openReviewMenu(page, projectName, 'Create new session')

    const newSession = dialog(page, 'Create Review Session')
    await newSession.getByLabel('Session label').fill(label)
    await newSession.getByRole('button', { name: 'Create session' }).click()

    await expect(toast(page, `Review session ${label} created`)).toBeVisible()
    await expect(toast(page, '1 folder skipped (no reviewables)')).toBeVisible()

    const lists = await api.listEntityLists(projectName)
    const session = await api.getEntityList(projectName, lists.find((l) => l.label === label)!.id)
    expect(session.entityType).toBe('version')
    expect(session.entityListType).toBe('review-session')
    expect(session.items.map((item) => item.entityId)).toEqual([newest.id])
  })

  test('adding to a session adds the newest version of each selected folder', async ({
    page,
    api,
    projectName,
  }) => {
    const newest = await seed(api, projectName)
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
    await expect(toast(page, 'Item added to session')).toBeVisible()

    const session = await api.getEntityList(projectName, listId)
    expect(session.items.map((item) => item.entityId)).toEqual([newest.id])
  })
})
