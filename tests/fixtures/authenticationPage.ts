import {expect, test as base } from '@playwright/test'
import type {Page } from '@playwright/test'

class AuthenticationPage {
  constructor(
    public readonly page: Page,
    public readonly browserName: String,
  ) {}

  async goto() {
    await this.page.goto('/')
  }
  async waitForNextPage() {
    await this.page.waitForURL('/dashboard/tasks')
  }

  async login(username: string, password: string) {
    await this.goto()

    // Perform authentication steps. Replace these actions with your own.
    await this.page.getByLabel('Username').fill(username)
    await this.page.getByLabel('Password').fill(password)
    await this.page.getByRole('button', { name: 'Login with password', exact: true }).click()
    await this.waitForNextPage()
  }

  async logout() {
    // await this.page.getByLabel('Username').fill(process.env.NAME)
    // await this.page.getByLabel('Password').fill(process.env.PASSWORD)
    // await this.page.getByRole('button', { name: 'Login', exact: true }).click()
    // await this.page.waitForURL('/dashboard/tasks')

    await this.page.getByLabel('User menu').click()
    await this.page.getByText('Sign out').click()
    await expect(this.page).toHaveURL('/login')
  }
}

const test = base.extend<{ authenticationPage: AuthenticationPage }>({
  authenticationPage : async ({ page, browserName }, use) => {
    const authenticationPage = new AuthenticationPage(page, browserName);
    await use(authenticationPage);
  },
});

export default AuthenticationPage
export { test as authenticationTest }