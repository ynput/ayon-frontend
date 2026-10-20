import { expect, test } from '../fixtures'
import { adminCredentials } from '../support/env'
import { DashboardTasksPage } from '../pages/DashboardTasksPage'
import { DetailsPanel } from '../pages/DetailsPanel'
import { menuItem } from '../support/ui'

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

  test('right-clicking another card keeps the selection', async ({ page, api, projectName }) => {
    const me = adminCredentials().name
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const first = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'first',
      assignees: [me],
    })
    const second = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'second',
      assignees: [me],
    })

    const dashboard = new DashboardTasksPage(page)
    await dashboard.goto()
    await dashboard.selectProject(projectName)
    await dashboard.card(first.id).click()
    await expect(dashboard.card(first.id)).toHaveClass(/active/)

    await dashboard.card(second.id).click({ button: 'right' })

    await expect(menuItem(page, 'Show details')).toBeVisible()
    await expect(dashboard.card(first.id)).toHaveClass(/active/)
    await expect(dashboard.card(second.id)).not.toHaveClass(/active/)

    // the details follow the selection, so showing them selects the right-clicked card
    await menuItem(page, 'Show details').click()

    await new DetailsPanel(page).expectOpenFor('second')
    await expect(dashboard.card(second.id)).toHaveClass(/active/)
    await expect(dashboard.card(first.id)).not.toHaveClass(/active/)
  })
})

test.describe('dashboard tasks list and filter', () => {
  test('change a task status from the list view', async ({ page, api, projectName }) => {
    const me = adminCredentials().name
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'comp',
      taskType: 'Compositing',
      assignees: [me],
    })
    const other = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'anim',
      taskType: 'Animation',
      assignees: [me],
    })

    const dashboard = new DashboardTasksPage(page)
    await dashboard.goto()
    await dashboard.selectProject(projectName)
    await dashboard.showList()
    await expect(dashboard.listRow(task.id)).toContainText('comp')
    await expect(dashboard.listRow(other.id)).toContainText('anim')

    await dashboard.setStatusInList(task.id, 'In progress')

    await expect(dashboard.listRowStatus(task.id)).toHaveAttribute('id', 'In progress')
    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).status)
      .toBe('In progress')
    expect((await api.getTask(projectName, other.id)).status).toBe('Not ready')
  })

  test('filter the board by task name', async ({ page, api, projectName }) => {
    const me = adminCredentials().name
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const comp = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'comp',
      taskType: 'Compositing',
      assignees: [me],
    })
    const anim = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'anim',
      taskType: 'Animation',
      assignees: [me],
    })

    const dashboard = new DashboardTasksPage(page)
    await dashboard.goto()
    await dashboard.selectProject(projectName)
    await expect(dashboard.card(comp.id)).toBeVisible()
    await expect(dashboard.card(anim.id)).toBeVisible()

    await dashboard.filter('anim')

    await expect(dashboard.card(anim.id)).toBeVisible()
    await expect(dashboard.card(comp.id)).toBeHidden()
    await expect(dashboard.columnHeadingOf(anim.id)).toHaveText(/^Not ready - 1$/)
  })

  test('filter the board for any of several terms, or for all words', async ({
    page,
    api,
    projectName,
  }) => {
    const me = adminCredentials().name
    const sh010 = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const sh020 = await api.createFolder(projectName, { name: 'sh020', folderType: 'Shot' })
    const anim010 = await api.createTask(projectName, {
      folderId: sh010.id,
      name: 'anim',
      taskType: 'Animation',
      assignees: [me],
    })
    const comp010 = await api.createTask(projectName, {
      folderId: sh010.id,
      name: 'comp',
      taskType: 'Compositing',
      assignees: [me],
    })
    const anim020 = await api.createTask(projectName, {
      folderId: sh020.id,
      name: 'anim',
      taskType: 'Animation',
      assignees: [me],
    })

    const dashboard = new DashboardTasksPage(page)
    await dashboard.goto()
    await dashboard.selectProject(projectName)
    await expect(dashboard.card(anim010.id)).toBeVisible()

    await dashboard.filter('sh020 anim')

    await expect(dashboard.card(anim020.id)).toBeVisible()
    await expect(dashboard.card(anim010.id)).toBeHidden()
    await expect(dashboard.card(comp010.id)).toBeHidden()

    await dashboard.filter('comp, sh020')

    await expect(dashboard.card(comp010.id)).toBeVisible()
    await expect(dashboard.card(anim020.id)).toBeVisible()
    await expect(dashboard.card(anim010.id)).toBeHidden()
  })

  test('changing the status in the details panel moves the card', async ({
    page,
    api,
    projectName,
  }) => {
    const me = adminCredentials().name
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'comp',
      taskType: 'Compositing',
      assignees: [me],
    })

    const dashboard = new DashboardTasksPage(page)
    await dashboard.goto()
    await dashboard.selectProject(projectName)
    await dashboard.card(task.id).getByText('comp', { exact: true }).click()
    const panel = new DetailsPanel(page)
    await panel.expectOpenFor('comp')

    await panel.setStatus('Approved')

    await expect(dashboard.columnHeadingOf(task.id)).toHaveText(/^Approved - 1$/)
    await expect.poll(async () => (await api.getTask(projectName, task.id)).status).toBe('Approved')
  })
})
