import { test as base, expect } from '@playwright/test'
import BrowserPage from './fixtures/browserPage'
import FolderPage, { getFolderName } from './fixtures/folderPage'
import ProjectPage, { getProjectName } from './fixtures/projectPage'

const PROJECT_NAME = 'test_project_reactions'
const FOLDER_NAME = 'test_project_reactions_folder'

const test = base.extend<{ projectPage: ProjectPage; folderPage: FolderPage; browserPage: BrowserPage }>({
  projectPage: async ({ page, browserName }, use) => {
    const projectPage = new ProjectPage(page, browserName)
    use(projectPage)
  },
  folderPage: async ({ page, browserName }, use) => {
    const folderPage = new FolderPage(page, browserName)
    await folderPage.goto('foo')
    use(folderPage)
  },
  browserPage: async ({ page, browserName }, use) => {
    const projectPage = new BrowserPage(page, browserName)
    use(projectPage)
  },
})

test('Reactions add/remove', async ({browserPage, browserName }) => {
  const projectName = getProjectName(PROJECT_NAME)(browserName)
  const folderName = getFolderName(FOLDER_NAME)(browserName)
  let thumbsUp = '👍'
  let thumbsDown = '👎'

  await expect(browserPage.page.getByText(thumbsUp)).toHaveCount(0)
  await expect(browserPage.page.getByText(thumbsDown)).toHaveCount(0)

  await browserPage.addReactionToComment(projectName, folderName, thumbsUp)
  await expect(browserPage.page.getByText(thumbsUp)).toBeVisible()
  await expect(browserPage.page.getByText(thumbsDown)).toHaveCount(0)

  await browserPage.addReactionToComment(projectName, folderName, thumbsDown)
  await expect(browserPage.page.getByText(thumbsUp)).toBeVisible()
  await expect(browserPage.page.getByText(thumbsDown)).toBeVisible()

  await browserPage.removeReactionFromComment(projectName, folderName, thumbsUp)
  await expect(browserPage.page.getByText(thumbsUp)).toHaveCount(0)
  await expect(browserPage.page.getByText(thumbsDown)).toBeVisible()

  await browserPage.removeReactionFromComment(projectName, folderName, thumbsDown)
  await expect(browserPage.page.getByText(thumbsUp)).toHaveCount(0)
  await expect(browserPage.page.getByText(thumbsDown)).toHaveCount(0)
})

test.beforeEach(async ({projectPage, folderPage, browserPage,browserName}) => {
  const projectName = getProjectName(PROJECT_NAME)(browserName)
  const folderName = getFolderName(FOLDER_NAME)(browserName)
  const commentName = 'Test comment'

  await projectPage.createProject(projectName)
  await folderPage.createFolder(projectName, folderName)
  await browserPage.addFolderComment(projectName, folderName, commentName)
})

test.afterEach(async ({projectPage, browserName}) => {
  const projectName = getProjectName(PROJECT_NAME)(browserName)

  await projectPage.deleteProject(projectName)
})
