import { test as base } from '@playwright/test'
import TaskPage, { getTaskName, taskTest } from './fixtures/taskPage'
import { getFolderName } from './fixtures/folderPage'
import FolderPage from './fixtures/folderPage'
import ProjectPage, { getProjectName } from './fixtures/projectPage'
import { beforeEach } from 'node:test'
import DashboardTasksPage from './fixtures/dashboardTasksPage'

const test = base.extend<{
  projectPage: ProjectPage
  folderPage: FolderPage
  taskPage: TaskPage
  dashboardTaskPage: DashboardTasksPage
}>({
  folderPage: async ({ page, browserName }, use) => {
    const _page = new FolderPage(page, browserName)
    await _page.goto('foo')
    use(_page)
  },
  projectPage: async ({ page, browserName }, use) => {
    const _page = new ProjectPage(page, browserName)
    use(_page)
  },
  taskPage: async ({ page, browserName }, use) => {
    const _page = new TaskPage(page)
    use(_page)
  },
  dashboardTaskPage: async ({ page, browserName }, use) => {
    const _page = new DashboardTasksPage(page)
    use(_page)
  },
})

test.describe('Task dashboard list view', () => {
  let projectName, folderName, taskName
  /*
  test.beforeEach(async ({ projectPage, folderPage, taskPage, browserName }) => {
    console.log('after each...')
    projectName = getProjectName('test_project_task')(browserName)
    folderName = getFolderName('test_project_task_folder')(browserName)
    taskName = getTaskName('test_project_task_task')(browserName)

    await projectPage.createProject(projectName)
    await folderPage.createFolder(projectName, folderName)
    await taskPage.createTask(projectName, folderName, taskName)
  })

  test.afterEach(async ({ projectPage, folderPage, taskPage, browserName }) => {
    console.log('after each...')
    const projectName = getProjectName('test_project_task')(browserName)
    await projectPage.deleteProject(projectName)
  })
    */

  test.describe('Task dashboard list view', () => {
    test.only('#729 task status change attempt should not change the currently selected task status when the status icon row is not part of selection', async ({
      taskPage,
      folderPage,
      projectPage,
      browserName,
     dashboardTaskPage,
    }) => {
    projectName = getProjectName('test_project_task')(browserName)
    folderName = getFolderName('test_project_task_folder')(browserName)
    taskName = getTaskName('test_project_task_task')(browserName)

    await projectPage.createProject(projectName)
    await folderPage.createFolder(projectName, folderName)

    await taskPage.createTask(projectName, folderName, taskName)
      taskPage.createTask(projectName, folderName, 'fooo')
      taskPage.createTask(projectName, folderName, 'bar')
      taskPage.createTask(projectName, folderName, 'zoo')
      dashboardTaskPage.goto()

      await projectPage.deleteProject(projectName)

      /*
      await taskPage.page.getByText('cg', { exact: true }).click()
      await taskPage.page.getByRole('button', { name: 'format_list_bulleted List' }).click()
      await taskPage.page.getByRole('button', { name: 'groups Assignees' }).click()
      await taskPage.page.getByText('done_allSelect All').click()
      await taskPage.page.getByText('AY_CG_demo/assets/characters').nth(1).click()
      await taskPage.page.getByRole('button', { name: 'play_arrow', exact: true }).nth(4).click()
      await taskPage.page.getByText('Pending review').click()
*/
    })

    test.skip('#729 task status change attempt should select task if not already selected', async ({
      projectPage,
      folderPage,
      taskPage,
      browserName,
    }) => {})
  })
})