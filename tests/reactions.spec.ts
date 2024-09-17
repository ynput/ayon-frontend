import { test as base, expect } from '@playwright/test'
import BrowserPage from './fixtures/browserPage'
import FolderPage, { getFolderName } from './fixtures/folderPage'
import ProjectPage, { getProjectName } from './fixtures/projectPage'


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

test('Reactions add/remove', async ({ projectPage, folderPage, browserPage, browserName }) => {
  const projectName = getProjectName('test_project_reactions')(browserName)
  const folderName = getFolderName('test_project_reactions_folder')(browserName)
  const commentName = 'Test comment'
  let thumbsUp = '👍'
  let thumbsDown = '👎'

  await projectPage.createProject(projectName)
  await folderPage.createFolder(projectName, folderName)
  await browserPage.addFolderComment(projectName, folderName, commentName)

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

  await browserPage.removeFolderComment(projectName, folderName, commentName)
  await projectPage.deleteProject(projectName)
})