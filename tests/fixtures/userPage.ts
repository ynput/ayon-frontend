import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

const getUserName = (prefix: string) => (browser: string) => prefix + '_' + browser

class UserPage {
  constructor(public readonly page: Page, public readonly browserName: String) {}

  async goto(userName?: string) {
    if (userName) {
      await this.page.goto(`/settings/users?name=${userName}`)
    }
    await this.page.goto('/settings/users')
  }

  async createUser(userName: string) {
    await this.goto()
    await this.page.getByRole('button', { name: 'person_add Add New User' }).click()
    await this.page.getByPlaceholder('No spaces allowed').fill(userName)
    await this.page.getByRole('button', { name: 'check Create and close' }).click()
    await expect(this.page.getByText('User created')).toBeVisible()
    await expect(
      this.page.locator('span').filter({ hasText: new RegExp(`^${userName}$`) }),
    ).toBeVisible()
  }

  async deleteUser(userName) {
    await this.goto(userName)
    await this.page.getByRole('button', { name: 'person_remove Delete Users' }).click()
    await this.page.getByLabel('Delete', { exact: true }).click()
    await expect(this.page.getByText('Deleted 1 user(s)')).toBeVisible()
    await expect(
      this.page.locator('span').filter({ hasText: new RegExp(`^${userName}$`) }),
    ).toBeHidden()
  }
}

const test = base.extend<{ userPage: UserPage }>({
  userPage: async ({ page, browserName }, use) => {
    const userPage = new UserPage(page, browserName)
    await use(userPage)
  },
})

export default UserPage
export { getUserName, test as userTest }
