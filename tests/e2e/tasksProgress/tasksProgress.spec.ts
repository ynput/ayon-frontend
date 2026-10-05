import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { TasksProgressPage } from '../pages/TasksProgressPage'

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
    status: 'In progress',
  })
  return { comp, anim }
}

test.describe('task progress', () => {
  test('shows the tasks of the selected folder with their status', async ({
    page,
    api,
    projectName,
  }) => {
    await seed(api, projectName)
    const progress = new TasksProgressPage(page)
    await progress.goto(projectName)
    await expect(page.getByText('Select a folder to begin.')).toBeVisible()

    await progress.selectFolder('sq010')

    await expect(page.getByRole('columnheader', { name: /Compositing/ })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Animation/ })).toBeVisible()
    await expect(progress.taskCell('sh010', 'comp')).toContainText('Not ready')
    await expect(progress.taskCell('sh020', 'anim')).toContainText('In progress')
  })

  test('change a task status from its cell', async ({ page, api, projectName }) => {
    const { comp } = await seed(api, projectName)
    const progress = new TasksProgressPage(page)
    await progress.goto(projectName)
    await progress.selectFolder('sq010')

    await progress.setStatus('sh010', 'comp', 'Approved')

    await expect.poll(async () => (await api.getTask(projectName, comp.id)).status).toBe('Approved')
  })
})

test.describe('task progress editing', () => {
  test('change the status of several tasks at once', async ({ page, api, projectName }) => {
    const { comp, anim } = await seed(api, projectName)
    const progress = new TasksProgressPage(page)
    await progress.goto(projectName)
    await progress.selectFolder('sq010')

    await progress.selectCells(['sh010', 'comp'], ['sh020', 'anim'])
    await progress.setStatusOfSelected('sh010', 'comp', 'On hold')

    await expect(progress.taskCell('sh010', 'comp')).toContainText('On hold')
    await expect(progress.taskCell('sh020', 'anim')).toContainText('On hold')
    await expect
      .poll(async () => [
        (await api.getTask(projectName, comp.id)).status,
        (await api.getTask(projectName, anim.id)).status,
      ])
      .toEqual(['On hold', 'On hold'])
  })

  test('assign a user to a task', async ({ page, api, projectName, createUser, accessGroup }) => {
    const { comp } = await seed(api, projectName)
    // only licensed users with access to the project are offered as assignees
    const artist = await createUser({
      fullName: 'Progress Artist',
      licensed: true,
      accessGroups: { [projectName]: [accessGroup] },
    })
    const progress = new TasksProgressPage(page)
    await progress.goto(projectName)
    await progress.selectFolder('sq010')

    await progress.addAssignee('sh010', 'comp', artist.name)

    await expect
      .poll(async () => (await api.getTask(projectName, comp.id)).assignees)
      .toEqual([artist.name])
    await expect(progress.assigneeAvatar('sh010', 'comp', artist.name)).toBeVisible()
  })
})
