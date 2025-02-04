import { test as base, expect } from '@playwright/test'
import BrowserPage from './fixtures/browserPage'
import FolderPage, { getFolderName } from './fixtures/folderPage'
import ProjectPage, { getProjectName } from './fixtures/projectPage'
import UserPage from './fixtures/userPage'
import PermissionsPage from './fixtures/permissionsPage'
import ProjectUserAccessGroupsPage from './fixtures/projectUserAccessGroupsPage'

const PROJECT_PREFIX = 'tp_uag'

const test = base.extend<{
  projectPage: ProjectPage
  userPage: UserPage
  permissionsPage: PermissionsPage
  projectUserAccessGroupsPage: ProjectUserAccessGroupsPage
}>({
  projectPage: async ({ page, browserName }, use) => {
    const projectPage = new ProjectPage(page, browserName)
    use(projectPage)
  },
  userPage: async ({ page, browserName }, use) => {
    const projectPage = new UserPage(page, browserName)
    use(projectPage)
  },
  permissionsPage: async ({ page, browserName }, use) => {
    const permissionsPage = new PermissionsPage(page, browserName)
    use(permissionsPage)
  },
  projectUserAccessGroupsPage: async ({ page, browserName }, use) => {
    const projectUserAccessGroupsPage = new ProjectUserAccessGroupsPage(page, browserName)
    use(projectUserAccessGroupsPage)
  },
})

test('Add/remove user to access group', async ({
  projectPage,
  userPage,
  permissionsPage,
  projectUserAccessGroupsPage,
  browserName,
}) => {
  const projectName = getProjectName(PROJECT_PREFIX)(browserName)
  const userName = `${projectName}_user`
  const accessGroupName = `${projectName}_ag`

  await projectUserAccessGroupsPage.assignToAccessGroups(projectName, userName, [accessGroupName], true)
  await projectUserAccessGroupsPage.removeFromAccessGroup(projectName, userName, accessGroupName)

})

test.beforeEach(async ({userPage, permissionsPage, projectPage, browserName}) => {
  const projectName = getProjectName(PROJECT_PREFIX)(browserName)
  const userName = `${projectName}_user`
  const accessGroupName = `${projectName}_ag`

  await projectPage.createProject(projectName)
  await userPage.createUser(userName)
  await permissionsPage.create(accessGroupName)
})

test.afterEach(async ({userPage, permissionsPage, projectPage, browserName}) => {
  const projectName = getProjectName(PROJECT_PREFIX)(browserName)
  const userName = `${projectName}_user`
  const accessGroupName = `${projectName}_ag`

  await projectPage.deleteProject(projectName)
  await userPage.deleteUser(userName)
  await permissionsPage.delete(accessGroupName)
})