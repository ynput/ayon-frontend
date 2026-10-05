import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { MEDIA } from '../media'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'
import { ViewerPage } from '../pages/ViewerPage'

/**
 * What a feed is made of: an entity's own activities plus those of related entities (comments on
 * the tasks of a folder, versions published from a task), filtered and loaded page by page.
 */

/** Shot sh010 with task "lighting"; optionally version v001 of renderMain published from it */
const setup = async (api: AyonApi, projectName: string, { publish = false } = {}) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const task = await api.createTask(projectName, {
    folderId: folder.id,
    name: 'lighting',
    taskType: 'Lighting',
  })
  if (!publish) return { folder, task }
  const product = await api.createProduct(projectName, { folderId: folder.id, name: 'renderMain' })
  // creating a version is publishing it: the server adds a "version.publish" activity
  const version = await api.createVersion(projectName, {
    productId: product.id,
    version: 1,
    taskId: task.id,
  })
  return { folder, task, version }
}

const openDetails = async (page: Page, projectName: string, name: string) => {
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.expand('sh010')
  return overview.openDetails(name)
}

test.describe('feed content', () => {
  test("a folder's feed shows the comments and versions of its tasks", async ({
    page,
    api,
    projectName,
  }) => {
    const { folder, task, version } = await setup(api, projectName, { publish: true })
    await api.createComment(projectName, 'folder', folder.id, 'Shot is approved for comp')
    await api.createComment(projectName, 'task', task.id, 'Lighting needs another pass')

    const panel = await openDetails(page, projectName, 'sh010')

    await expect(panel.comment('Shot is approved for comp')).toBeVisible()
    // a task comment says where it was made: "<author> commented on <lighting>"
    await expect(panel.comment('Lighting needs another pass')).toContainText(/commented\s*on/)
    await expect(panel.reference('Lighting needs another pass', 'lighting')).toBeVisible()
    await expect(panel.activity(/published a version/)).toContainText(/renderMain.*v001/)
    // (the publish activity comes from a server event, so its place in the order varies)
    const feed = async () =>
      (
        await api.listFeedActivities(projectName, folder.id, {
          activityTypes: ['comment', 'version.publish'],
        })
      )
        .map((a) => [a.activityType, a.referenceType, a.origin?.id].join(' '))
        .sort()
    await expect
      .poll(feed)
      .toEqual([
        `comment origin ${folder.id}`,
        `comment relation ${task.id}`,
        `version.publish relation ${version!.id}`,
      ])
  })

  test('a comment on a version shows in the feed of its task', async ({
    page,
    api,
    projectName,
  }) => {
    const { task, version } = await setup(api, projectName, { publish: true })
    await api.createComment(projectName, 'version', version!.id, 'Highlights clip in v001')

    const panel = await openDetails(page, projectName, 'lighting')

    await expect(panel.comment('Highlights clip in v001')).toContainText(/commented\s*on/)
    await expect(panel.reference('Highlights clip in v001', 'v001')).toBeVisible()
    await expect
      .poll(async () =>
        (
          await api.listFeedActivities(projectName, task.id, { activityTypes: ['comment'] })
        ).map((a) => [a.referenceType, a.origin?.id]),
      )
      .toEqual([['relation', version!.id]])
  })

  test('a published version shows in the feed of its task and opens in the viewer', async ({
    page,
    api,
    projectName,
  }) => {
    const { version } = await setup(api, projectName, { publish: true })
    await api.uploadReviewable(projectName, version!.id, MEDIA.stillImage.path)
    const panel = await openDetails(page, projectName, 'lighting')
    const published = panel.activity(/published a version/)
    await expect(published).toContainText(/renderMain.*v001/)

    // FLAG: the version card is a div without a role, clicking its name opens it
    await published.getByText('v001', { exact: true }).click()

    const viewer = new ViewerPage(page)
    await viewer.expectVersion('v001')
    await viewer.expectImage(MEDIA.stillImage.fileName, MEDIA.stillImage)
  })

  test('show only published versions in the feed', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName, { publish: true })
    await api.createComment(projectName, 'task', task.id, 'Lighting needs another pass')
    const panel = await openDetails(page, projectName, 'lighting')
    const published = panel.activity(/published a version/)
    await expect(panel.comment('Lighting needs another pass')).toBeVisible()
    await expect(published).toBeVisible()

    await panel.addFeedFilter('Versions')

    // a versions-only feed has no comment box
    await expect(panel.root.getByText('Leave a comment')).toBeHidden()
    await expect(published).toBeVisible()
    await expect(panel.comment('Lighting needs another pass')).toBeHidden()
    await expect
      .poll(
        async () =>
          (
            await api.listFeedActivities(projectName, task.id, {
              activityTypes: ['version.publish'],
            })
          ).length,
      )
      .toBe(1)
  })

  test('older comments load when scrolling up the feed', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    // one page is 30 activities (`activitiesLast` in Feed.tsx)
    const notes = Array.from({ length: 35 }, (_, i) => `Note ${String(i + 1).padStart(2, '0')}`)
    for (const note of notes) await api.createComment(projectName, 'task', task.id, note)
    const panel = await openDetails(page, projectName, 'lighting')
    await expect(panel.comment('Note 35')).toBeVisible()
    await expect(panel.comment('Note 06')).toBeAttached()
    await expect(panel.comment('Note 05')).toHaveCount(0)

    // the newest are at the bottom, scroll up to the oldest loaded one
    await panel.comment('Note 06').scrollIntoViewIfNeeded()

    await expect(panel.comment('Note 01')).toBeAttached()
    await panel.comment('Note 01').scrollIntoViewIfNeeded()
    await expect(panel.comment('Note 01')).toBeVisible()
    // every comment once, the pages do not overlap
    // FLAG: `li.comment`, the comment box's submit button has the class `comment` too
    await expect(panel.root.locator('.feed li.comment')).toHaveCount(35)
    expect(await api.listActivities(projectName, 'task', task.id)).toHaveLength(35)
  })
})
