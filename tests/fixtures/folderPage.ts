import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

const getFolderName = prefix => browser => prefix + '_' + browser

class FolderPage {
  constructor(
    public readonly page: Page,
    public readonly browserName: String,
  ) {}

  async goto(projectName) {
    await this.page.goto(`/projects/${projectName}/editor`)
  }

  async createFolder(projectName, folderName) {
    await this.goto(projectName)
    await this.page.getByRole('button', { name: 'create_new_folder Add Folders' }).click()
    await expect(this.page.getByText('add new root folder')).toBeVisible()
    await this.page.locator('li[data-value="Folder"]').click()
    await this.page.locator('input[value="Folder"]').fill(folderName)
    await this.page.getByRole('button', { name: 'check Add and Close' }).click()
    await expect(this.page.getByRole('cell', { name: folderName })).toBeVisible()
    await this.page.getByRole('button', { name: 'check Save Changes' }).click()
    await this.page.getByText('Changes saved').click()
  }

  async deleteFolder(projectName, folderName) {
    await this.goto(projectName)
    await expect(this.page.getByRole('cell', { name: folderName })).toBeVisible()
    await this.page.getByRole('cell', { name: folderName }).click({ button: 'right' })
    await this.page.getByRole('menuitem', { name: 'delete Delete' }).click()
    await this.page.getByRole('button', { name: 'check Save Changes' }).click()
    await this.page.getByText('Changes saved').click()
    await expect(this.page.getByRole('cell', { name: folderName })).toBeHidden()
  }
}

const test = base.extend<{ folderPage: FolderPage }>({
  folderPage: async ({ page, browserName }, use) => {
    const folderPage = new FolderPage(page, browserName)
    await use(folderPage)
  },
})

export default FolderPage

export { getFolderName, test as folderTest }
