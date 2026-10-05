import { expect, test } from '../fixtures'
import { adminCredentials } from '../support/env'
import { DashboardTasksPage } from '../pages/DashboardTasksPage'
import { DetailsPanel } from '../pages/DetailsPanel'

test.describe('dashboard tasks', () => {
  test('tasks assigned to me show up on the board under their status', async ({
    page,
    api,
    projectName,
  }) => {
    const me = adminCredentials().name
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const mine = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'mine',
      assignees: [me],
    })
    const wip = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'mine_wip',
      assignees: [me],
      status: 'In progress',
    })
    const notMine = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'not_mine',
      assignees: [],
    })

    const dashboard = new DashboardTasksPage(page)
    await dashboard.goto()
    await dashboard.selectProject(projectName)

    await expect(dashboard.card(mine.id)).toContainText('mine')
    await expect(dashboard.columnHeadingOf(mine.id)).toHaveText(/^Not ready - 1$/)
    await expect(dashboard.columnHeadingOf(wip.id)).toHaveText(/^In progress - 1$/)
    await expect(dashboard.card(notMine.id)).toBeHidden()
  })

  test('drag a task card to another status', async ({ page, api, projectName }) => {
    const me = adminCredentials().name
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'drag_me',
      assignees: [me],
    })

    const dashboard = new DashboardTasksPage(page)
    await dashboard.goto()
    await dashboard.selectProject(projectName)
    await expect(dashboard.columnHeadingOf(task.id)).toHaveText(/^Not ready/)

    await dashboard.dragCardToStatus(task.id, 'In progress')

    await expect(dashboard.columnHeadingOf(task.id)).toHaveText(/^In progress - 1$/)
    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).status)
      .toBe('In progress')
  })

  test('clicking the task title on a card opens its details', async ({
    page,
    api,
    projectName,
  }) => {
    const me = adminCredentials().name
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'open_me',
      assignees: [me],
    })

    const dashboard = new DashboardTasksPage(page)
    await dashboard.goto()
    await dashboard.selectProject(projectName)
    // clicking the card only selects it, the title opens the details panel
    await dashboard.card(task.id).getByText('open_me', { exact: true }).click()

    await new DetailsPanel(page).expectOpenFor('open_me')
  })
})
