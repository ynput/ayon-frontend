import { test as base } from '@playwright/test'
import ProjectPage, { getProjectName } from './fixtures/projectPage'
import FolderPage, { getFolderName } from './fixtures/folderPage'

const test = base.extend<{projectPage: ProjectPage, folderPage: FolderPage}>({
  folderPage: async ({page, browserName}, use) => {
    const folderPage = new FolderPage(page, browserName)
    await folderPage.goto('foo')
    use(folderPage)
  },
  projectPage: async ({page, browserName}, use) => {
    const projectPage = new ProjectPage(page, browserName)
    use(projectPage)
  },
})

test('create/delete folder', async ({ projectPage, folderPage, browserName }) => {
  const projectName = getProjectName('test_project_folder')(browserName)
  const folderName = getFolderName('foo_project_folder_folder')(browserName)
  await projectPage.createProject(projectName)
  await folderPage.createFolder(projectName, folderName)
  await folderPage.deleteFolder(projectName, folderName)
  await projectPage.deleteProject(projectName)
})
