import { expect, test } from '../fixtures'
import { TasksProgressPage } from '../pages/TasksProgressPage'
import { deleteTask, LIVE_UPDATE, LiveUpdates } from './live'

/**
 * Task progress is open in the admin's browser while the tasks change through the REST API,
 * i.e. from another client: the grid must follow without a reload.
 */
test.describe('task progress live updates', () => {
  test('status changes, new and deleted tasks made elsewhere show in the open grid', async ({
    page,
    api,
    projectName,
  }) => {
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

    const progress = new TasksProgressPage(page)
    const live = new LiveUpdates(page)
    await progress.goto(projectName)
    await progress.selectFolder('sq010')
    await expect(progress.taskCell('sh010', 'comp')).toContainText('Not ready')
    await expect(progress.taskCell('sh020', 'anim')).toBeVisible()
    await expect(progress.taskCell('sh020', 'comp')).toBeHidden()
    await live.expectSubscribed('entity.task.status_changed', projectName)

    await api.updateTask(projectName, comp.id, { status: 'Approved' })
    // the Compositing column already exists, so the new task gets a cell in the sh020 row
    await api.createTask(projectName, { folderId: sh020.id, name: 'comp', taskType: 'Compositing' })
    await deleteTask(api, projectName, anim.id)

    await expect(progress.taskCell('sh010', 'comp')).toContainText('Approved', LIVE_UPDATE)
    await expect(progress.taskCell('sh020', 'comp')).toContainText('Not ready', LIVE_UPDATE)
    await expect(progress.taskCell('sh020', 'anim')).toBeHidden(LIVE_UPDATE)
  })
})
