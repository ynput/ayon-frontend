import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { DetailsPanel } from '../pages/DetailsPanel'
import { OverviewPage } from '../pages/OverviewPage'

const setup = async (api: AyonApi, projectName: string) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const lighting = await api.createTask(projectName, {
    folderId: folder.id,
    name: 'lighting',
    taskType: 'Lighting',
  })
  const comp = await api.createTask(projectName, {
    folderId: folder.id,
    name: 'comp',
    taskType: 'Compositing',
  })
  const product = await api.createProduct(projectName, { folderId: folder.id, name: 'renderMain' })
  const version = await api.createVersion(projectName, {
    productId: product.id,
    version: 1,
    taskId: lighting.id,
  })
  return { folder, lighting, comp, version }
}

const openTask = async (page: Page, projectName: string, name: string) => {
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.expand('sh010')
  return overview.openDetails(name)
}

const mentionsOf = (api: AyonApi, projectName: string, entityId: string) => async () =>
  (await api.listFeedActivities(projectName, entityId, { activityTypes: ['comment'] })).map(
    (a) => ({ body: a.body, referenceType: a.referenceType, origin: a.origin?.name }),
  )

test.describe('references in comments', () => {
  test('mention a task of the same shot', async ({ page, api, projectName }) => {
    const { lighting, comp } = await setup(api, projectName)
    const panel = await openTask(page, projectName, 'lighting')
    await panel.openCommentBox()

    await panel.commentEditor.pressSequentially('Match the edges of ')
    await panel.mention('@@@', 'comp', 'comp')
    await panel.submitComment()

    await expect(panel.reference('Match the edges of', 'comp')).toBeVisible()
    const body = `Match the edges of [comp](task:${comp.id})`
    await expect
      .poll(async () =>
        (await api.listActivities(projectName, 'task', lighting.id)).map((a) => a.body.trim()),
      )
      .toEqual([body])
    await expect.poll(mentionsOf(api, projectName, comp.id)).toEqual([
      {
        body: expect.stringContaining(`(task:${comp.id})`),
        referenceType: 'mention',
        origin: 'lighting',
      },
    ])
  })

  test('mention a version of the task', async ({ page, api, projectName }) => {
    const { lighting, version } = await setup(api, projectName)
    const panel = await openTask(page, projectName, 'lighting')
    await panel.openCommentBox()

    await panel.commentEditor.pressSequentially('Fixed in ')
    await panel.mention('@@', 'v001', 'v001')
    await panel.submitComment()

    await expect(panel.reference('Fixed in', 'v001')).toBeVisible()
    await expect
      .poll(async () =>
        (await api.listActivities(projectName, 'task', lighting.id)).map((a) => a.body.trim()),
      )
      .toEqual([`Fixed in [v001](version:${version.id})`])
    await expect
      .poll(mentionsOf(api, projectName, version.id))
      .toContainEqual(expect.objectContaining({ referenceType: 'mention', origin: 'lighting' }))
  })

  test('open a mentioned task from the comment', async ({ page, api, projectName }) => {
    const { lighting, comp } = await setup(api, projectName)
    await api.createComment(projectName, 'task', lighting.id, `Match [comp](task:${comp.id}) edges`)
    const panel = await openTask(page, projectName, 'lighting')

    await panel.reference('Match', 'comp').click()

    const slideOut = DetailsPanel.slideOut(page)
    await slideOut.expectOpenFor('comp')
    await expect(slideOut.comment('Match')).toBeVisible()
    await slideOut.close()
    await expect(panel.comment('Match')).toBeVisible()
  })

  test("a mentioned task's feed shows the comment and where it was made", async ({
    page,
    api,
    projectName,
  }) => {
    const { lighting, comp } = await setup(api, projectName)
    await api.createComment(projectName, 'task', lighting.id, `Match [comp](task:${comp.id}) edges`)

    const panel = await openTask(page, projectName, 'comp')

    const comment = panel.comment('Match')
    await expect(comment).toContainText('mentioned task on')
    await expect(panel.reference('Match', 'lighting')).toBeVisible()
    await expect
      .poll(mentionsOf(api, projectName, comp.id))
      .toEqual([{ body: expect.any(String), referenceType: 'mention', origin: 'lighting' }])

    await panel.reference('Match', 'lighting').click()
    const slideOut = DetailsPanel.slideOut(page)
    await slideOut.expectOpenFor('lighting')
    await expect(slideOut.comment('Match')).toBeVisible()
  })

  test('editing a comment keeps its references', async ({ page, api, projectName }) => {
    const { lighting, comp } = await setup(api, projectName)
    const body = `Match [comp](task:${comp.id}) edges`
    await api.createComment(projectName, 'task', lighting.id, body)
    const panel = await openTask(page, projectName, 'lighting')
    const id = await panel.comment('Match').getAttribute('id')
    const comment = panel.root.locator(`.comment[id="${id}"]`)

    await comment.hover()
    await comment.getByRole('button', { name: 'edit_square' }).click()
    const editor = comment.locator('[contenteditable="true"]')
    await expect(editor).toBeFocused()
    await editor.press('ControlOrMeta+End')
    await editor.pressSequentially(' first')
    await comment.getByRole('button', { name: 'Save' }).click()

    await expect(editor).toHaveCount(0)
    await expect(panel.comment('edges first')).toBeVisible()
    await expect(panel.reference('edges first', 'comp')).toBeVisible()
    await expect
      .poll(async () => (await api.listActivities(projectName, 'task', lighting.id))[0]?.body)
      .toBe(`${body} first`)
    await expect
      .poll(mentionsOf(api, projectName, comp.id))
      .toEqual([{ body: `${body} first`, referenceType: 'mention', origin: 'lighting' }])
  })

  // FLAG (backend bug): editing a comment never removes a mention, update_activity re-inserts it
  // fixed in ynput/ayon-backend#1168, switch back to test() once it is merged
  test.fixme(
    'removing a reference while editing takes the comment out of that feed',
    async ({ page, api, projectName }) => {
      const { lighting, comp } = await setup(api, projectName)
      await api.createComment(
        projectName,
        'task',
        lighting.id,
        `Match [comp](task:${comp.id}) edges`,
      )
      const panel = await openTask(page, projectName, 'lighting')
      await expect(panel.reference('Match', 'comp')).toBeVisible()

      await panel.editComment('Match', 'Edges are fine now')

      await expect(panel.reference('Edges are fine now', 'comp')).toHaveCount(0)
      await expect
        .poll(async () => (await api.listActivities(projectName, 'task', lighting.id))[0]?.body)
        .toBe('Edges are fine now')
      await expect.poll(mentionsOf(api, projectName, comp.id)).toEqual([])
    },
  )
})
