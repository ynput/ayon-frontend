import { Locator, Page } from '@playwright/test'
import { menuItem } from '../support/ui'

export class LoginPage {
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly userMenuButton: Locator

  constructor(readonly page: Page) {
    this.usernameInput = page.getByLabel('Username')
    this.passwordInput = page.getByLabel('Password')
    this.submitButton = page.getByRole('button', { name: 'Login with password' })
    this.userMenuButton = page.getByRole('button', { name: 'User menu' })
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(name: string, password: string) {
    await this.usernameInput.fill(name)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async signOut() {
    await this.userMenuButton.click()
    await menuItem(this.page, 'Sign out').click()
  }
}
