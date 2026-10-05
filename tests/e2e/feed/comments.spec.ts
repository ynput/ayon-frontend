import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'

/** A shot with one task, opened in the overview details panel */
const setup = async (api: AyonApi, projectName: string) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const task = await api.createTask(projectName, {
    folderId: folder.id,
    name: 'lighting',
    taskType: 'Lighting',
  })
  return { folder, task }
}

const openTask = async (page: Page, projectName: string) => {
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.expand('sh010')
  return overview.openDetails('lighting')
}

const commentBodies = (api: AyonApi, projectName: string, taskId: string) => async () =>
  (await api.listActivities(projectName, 'task', taskId)).map((a) => a.body)

test.describe('activity feed', () => {
  test('add a comment to a task', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    const panel = await openTask(page, projectName)

    await panel.addComment('First pass looks great')

    await expect.poll(commentBodies(api, projectName, task.id)).toEqual(['First pass looks great'])
  })

  test('edit a comment', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    await api.createComment(projectName, 'task', task.id, 'Typo in this coment')
    const panel = await openTask(page, projectName)

    await panel.editComment('Typo in this coment', 'Fixed comment')

    await expect(panel.comment('Typo in this coment')).toBeHidden()
    await expect.poll(commentBodies(api, projectName, task.id)).toEqual(['Fixed comment'])
  })

  test('delete a comment', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    await api.createComment(projectName, 'task', task.id, 'Keep this one')
    await api.createComment(projectName, 'task', task.id, 'Remove this one')
    const panel = await openTask(page, projectName)

    await panel.deleteComment('Remove this one')

    await expect(panel.comment('Keep this one')).toBeVisible()
    await expect.poll(commentBodies(api, projectName, task.id)).toEqual(['Keep this one'])
  })

  test('add and remove a reaction on a comment', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    await api.createComment(projectName, 'task', task.id, 'React to me')
    const panel = await openTask(page, projectName)
    const reactions = async () =>
      (await api.listActivities(projectName, 'task', task.id))[0].reactions.map(
        (r: any) => r.reaction,
      )

    await panel.react('React to me', '👍')
    await expect(panel.reaction('React to me', '👍')).toHaveClass(/active/)
    await expect.poll(reactions).toEqual(['thumb_up'])

    // clicking an existing reaction toggles it off again
    await panel.reaction('React to me', '👍').click()
    await expect(panel.comment('React to me').locator('.emoji', { hasText: '👍' })).toHaveCount(0)
    await expect.poll(reactions).toEqual([])
  })

  test('change the task status from the details panel', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    const panel = await openTask(page, projectName)

    await panel.setStatus('Pending review')

    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).status)
      .toBe('Pending review')
  })
})
