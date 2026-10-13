import { expect, Locator, Page } from '@playwright/test'
import { dialog, toast } from '../support/ui'

export class AccountPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto('/account/profile')
    await expect(this.input('Username')).not.toHaveValue('', { timeout: 30_000 })
  }

  // FLAG: FormRow labels are plain divs not associated with their inputs, so `getByLabel` does not work
  field(label: string): Locator {
    return this.page
      .locator('main .label', { hasText: new RegExp(`^${label}$`) })
      .locator('xpath=following-sibling::*[1]')
  }

  input(label: string): Locator {
    return this.field(label).locator('input').first()
  }

  get saveButton() {
    return this.page.getByRole('button', { name: 'Save profile' })
  }

  async setFullName(fullName: string) {
    await this.input('Full name').fill(fullName)
    await this.saveButton.click()
    await expect(toast(this.page, 'Profile updated')).toBeVisible()
  }

  async changePassword(name: string, password: string) {
    await this.field('Password').getByRole('button', { name: 'edit' }).click()
    const setPassword = dialog(this.page, `Set password for: ${name}`)
    await expect(setPassword).toBeVisible()
    // FLAG: both inputs have id="password" and their labels are not associated with them
    await setPassword.locator('input[type="password"]').nth(0).fill(password)
    await setPassword.locator('input[type="password"]').nth(1).fill(password)
    await setPassword.getByRole('button', { name: 'Set Password' }).click()
    await expect(toast(this.page, 'Password changed')).toBeVisible()
    await expect(setPassword).toBeHidden()
  }
}
