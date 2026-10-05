import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { apiAs, signInAs } from '../support/session'
import { OverviewPage } from '../pages/OverviewPage'
import { addReaction, deleteComment, editComment, LIVE_UPDATE, LiveUpdates } from './live'

/**
 * The details panel of a task is open in one browser while someone else comments on the task,
 * reacts or changes it: the open panel and its activity feed must follow without a reload.
 */

const seed = async (api: AyonApi, projectName: string) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const task = await api.createTask(projectName, {
    folderId: folder.id,
    name: 'comp',
    taskType: 'Compositing',
  })
  return { folder, task }
}

/** Open the task's details panel from the overview */
const openTask = async (page: Page, projectName: string) => {
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.expand('sh010')
  return overview.openDetails('comp')
}

test.describe('activity feed live updates', () => {
  test('a comment another user posts in their browser appears in my open feed', async ({
    page,
    api,
    projectName,
    createUser,
    accessGroup,
    browser,
  }) => {
    const fullName = `Live${Math.random().toString(36).slice(2, 8)} Commenter`
    const other = await createUser({ fullName, accessGroups: { [projectName]: [accessGroup] } })
    const { task } = await seed(api, projectName)
    // a comment that is already there shows that the feed has loaded
    await api.createComment(projectName, 'task', task.id, 'Earlier note')
    const live = new LiveUpdates(page)
    const panel = await openTask(page, projectName)
    await expect(panel.comment('Earlier note')).toBeVisible()
    await live.expectSubscribed('activity.created', projectName)

    const session = await signInAs(browser, other.name, other.password)
    try {
      const otherPanel = await openTask(session.page, projectName)
      await otherPanel.addComment('Edges need another pass')
    } finally {
      await session.context.close()
    }

    await expect(panel.comment('Edges need another pass')).toBeVisible(LIVE_UPDATE)
    await expect(panel.comment('Edges need another pass')).toContainText(fullName)
    await expect(panel.comment('Earlier note')).toBeVisible()
  })

  test('a reaction, an edit and a delete made elsewhere update my open feed', async ({
    page,
    api,
    projectName,
    createUser,
    accessGroup,
  }, testInfo) => {
    const other = await createUser({ accessGroups: { [projectName]: [accessGroup] } })
    const { task } = await seed(api, projectName)
    const kept = await api.createComment(projectName, 'task', task.id, 'Check the edges')
    const removed = await api.createComment(projectName, 'task', task.id, 'Ignore this one')
    const live = new LiveUpdates(page)
    const panel = await openTask(page, projectName)
    await expect(panel.comment('Ignore this one')).toBeVisible()
    await live.expectSubscribed('activity.updated', projectName)

    // another user reacts
    const otherApi = await apiAs(testInfo, other.name, other.password)
    try {
      await addReaction(otherApi, projectName, kept, 'thumb_up')
    } finally {
      await otherApi.dispose()
    }
    await expect(panel.reaction('Check the edges', '👍')).toBeVisible(LIVE_UPDATE)
    // not my reaction, so it is not highlighted as one
    // FLAG: a reaction's "mine" state is only the `active` class, there is no pressed state
    await expect(panel.reaction('Check the edges', '👍')).not.toHaveClass(/active/)

    await editComment(api, projectName, kept, 'Check the edges and the grain')
    await expect(panel.comment('Check the edges and the grain')).toBeVisible(LIVE_UPDATE)

    await deleteComment(api, projectName, removed)
    await expect(panel.comment('Ignore this one')).toBeHidden(LIVE_UPDATE)
    await expect(panel.comment('Check the edges and the grain')).toBeVisible()
  })

  test('a status change made elsewhere shows in my open details panel', async ({
    page,
    api,
    projectName,
  }) => {
    const { task } = await seed(api, projectName)
    await api.createComment(projectName, 'task', task.id, 'Earlier note')
    const live = new LiveUpdates(page)
    const panel = await openTask(page, projectName)
    await expect(panel.statusSelect).toContainText('Not ready')
    await expect(panel.comment('Earlier note')).toBeVisible()
    await live.expectSubscribed('entity.task.status_changed', projectName)

    await api.updateTask(projectName, task.id, { status: 'Pending review' })

    await expect(panel.statusSelect).toContainText('Pending review', LIVE_UPDATE)
    // the change also shows up in the feed as an activity of its own
    await expect(panel.activity(/Not ready.*Pending review/)).toBeVisible(LIVE_UPDATE)
  })
})
