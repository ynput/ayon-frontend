import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

const getUserName = (prefix: string) => (browser: string) => prefix + '_' + browser

class PermissionsPage {
  constructor(public readonly page: Page, public readonly browserName: String) {}

  async goto(userName?: string) {
    await this.page.goto(`/settings/accessGroups`)
  }

  async create(accessGroup: string) {
    await this.goto()
    // await this.page.getByRole('button', { name: 'person_add Add New User' }).click()
    await this.page.getByRole('button', { name: 'group_add New access group' }).click();
    await this.page.getByRole('textbox').nth(1).fill(accessGroup);
    await this.page.getByRole('button', { name: 'group_add Create access group' }).click();
    await expect(this.page.getByRole('cell', {name: accessGroup})).toBeVisible()
    await this.page.getByRole('cell', { name: accessGroup }).click();
    await this.page.locator('.panel-header >  .material-symbols-outlined').first().click();
    await this.page.getByRole('button', { name: 'Read & Write' }).first().click();
    await this.page.getByRole('button', { name: 'Read & Write' }).nth(1).click();
    await this.page.getByRole('button', { name: 'Read & Write' }).nth(2).click();
    await this.page.getByRole('button', { name: 'check Save Changes' }).click();
  }

  async delete(accessGroup: string) {
    await this.goto()
    await this.page.getByRole('cell', { name: accessGroup }).click()
    await this.page.getByRole('button', { name: 'delete Delete access group' }).click();
    await this.page.getByLabel('Delete', { exact: true }).click();
    await expect(this.page.getByRole('cell', { name: accessGroup })).toBeHidden()
  }
}

const test = base.extend<{ userPage: PermissionsPage }>({
  userPage: async ({ page, browserName }, use) => {
    const permissionsPage = new PermissionsPage(page, browserName)
    await use(permissionsPage)
  },
})

export { getUserName, test as userTest }

export default PermissionsPage
