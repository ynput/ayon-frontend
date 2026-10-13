import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { TasksProgressPage } from '../pages/TasksProgressPage'
import { deleteTask, expectSyncHighlighted, LIVE_UPDATE, LiveUpdates, syncButton } from './live'

const seed = async (api: AyonApi, projectName: string) => {
  const sq = await api.createFolder(projectName, { name: 'sq010', folderType: 'Sequence' })
  const sh010 = await api.createFolder(projectName, {
    name: 'sh010',
    folderType: 'Shot',
    parentId: sq.id,
  })
  const sh020 = await api.createFolder(projectName, {
    name: 'sh020',
    folderType: 'Shot',
    parentId: sq.id,
  })
  const comp = await api.createTask(projectName, {
    folderId: sh010.id,
    name: 'comp',
    taskType: 'Compositing',
  })
  const anim = await api.createTask(projectName, {
    folderId: sh020.id,
    name: 'anim',
    taskType: 'Animation',
  })
  return { sh020, comp, anim }
}

const openProgress = async (progress: TasksProgressPage, projectName: string) => {
  await progress.goto(projectName)
  await progress.selectFolder('sq010')
  await expect(progress.taskCell('sh010', 'comp')).toContainText('Not ready')
  await expect(progress.taskCell('sh020', 'anim')).toBeVisible()
  await expect(progress.taskCell('sh020', 'comp')).toBeHidden()
}

test.describe('task progress live updates', () => {
  test('status changes and deletions made elsewhere show in the open grid', async ({
    page,
    api,
    projectName,
  }) => {
    const { comp, anim } = await seed(api, projectName)
    const progress = new TasksProgressPage(page)
    const live = new LiveUpdates(page)
    await openProgress(progress, projectName)
    await live.expectSubscribed('entity.task.status_changed', projectName)

    await api.updateTask(projectName, comp.id, { status: 'Approved' })
    await deleteTask(api, projectName, anim.id)

    await expect(progress.taskCell('sh010', 'comp')).toContainText('Approved', LIVE_UPDATE)
    await expect(progress.taskCell('sh020', 'anim')).toBeHidden(LIVE_UPDATE)
  })

  // FLAG (app bug): tasks created elsewhere are streamed in and the sync button never highlights for them
  // fixed in ynput/ayon-frontend#2423, switch back to test() once it is merged
  test.fixme(
    'a task created elsewhere is not streamed in: the sync button highlights and syncing shows it',
    async ({ page, api, projectName }) => {
      const { sh020, comp } = await seed(api, projectName)
      const progress = new TasksProgressPage(page)
      const live = new LiveUpdates(page)
      await openProgress(progress, projectName)
      await live.expectSubscribed('entity.task.created', projectName)

      await api.createTask(projectName, {
        folderId: sh020.id,
        name: 'comp',
        taskType: 'Compositing',
      })
      // a later rename is fetched together with, or after, a streamed creation
      await api.updateTask(projectName, comp.id, { label: 'Final comp' })

      await expect(progress.taskCell('sh010', 'Final comp')).toBeVisible(LIVE_UPDATE)
      await expect(progress.taskCell('sh020', 'comp')).toBeHidden()
      const sync = syncButton(page.locator('.tasks-progress-table'))
      await expectSyncHighlighted(sync, /new task/)
      // FLAG (app bug): Shift+R on a focused slicer row renames the folder instead of syncing, so focus the grid
      await progress.taskCell('sh010', 'Final comp').click()

      await page.keyboard.press('Shift+R')

      await expect(progress.taskCell('sh020', 'comp')).toContainText('Not ready')
      await expect(sync).not.toHaveClass(/has-updates/)
    },
  )
})
