import { test as base } from '@playwright/test'
import TaskPage, { getTaskName, taskTest } from './fixtures/taskPage'
import { getFolderName } from './fixtures/folderPage'
import FolderPage from './fixtures/folderPage'
import ProjectPage, { getProjectName } from './fixtures/projectPage'

const test = base.extend<{ projectPage: ProjectPage; folderPage: FolderPage; taskPage: TaskPage }>({
  folderPage: async ({ page, browserName }, use) => {
    const folderPage = new FolderPage(page, browserName)
    await folderPage.goto('foo')
    use(folderPage)
  },
  projectPage: async ({ page, browserName }, use) => {
    const projectPage = new ProjectPage(page, browserName)
    use(projectPage)
  },
  taskPage: async ({ page, browserName }, use) => {
    const taskPage = new TaskPage(page)
    use(taskPage)
  },
})

test('create/delete task', async ({ projectPage, folderPage, taskPage, browserName }) => {
  const projectName = getProjectName('test_project_task')(browserName)
  const folderName = getFolderName('test_project_task_folder')(browserName)
  const taskName = getTaskName('test_project_task_task')(browserName)

  await projectPage.createProject(projectName)
  await folderPage.createFolder(projectName, folderName)
  await taskPage.createTask(projectName, folderName, taskName)
  await taskPage.deleteTask(projectName, folderName, taskName)
  await folderPage.deleteFolder(projectName, folderName)
  await projectPage.deleteProject(projectName)
})
