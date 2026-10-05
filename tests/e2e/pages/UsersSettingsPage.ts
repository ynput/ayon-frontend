import { expect, Page } from '@playwright/test'
import { dialog, menuItem, toast } from '../support/ui'

/** /settings/users */
export class UsersSettingsPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto('/settings/users')
    await expect(this.page.getByPlaceholder('Filter users...')).toBeVisible({ timeout: 30_000 })
  }

  async filter(text: string) {
    await this.page.getByPlaceholder('Filter users...').fill(text)
  }

  row(name: string) {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  async createUser({ name, password }: { name: string; password: string }) {
    await this.page.getByRole('button', { name: 'Add New User' }).click()
    const newUser = dialog(this.page, 'Create New User')
    await expect(newUser).toBeVisible()
    await newUser.getByPlaceholder('No spaces allowed').fill(name)
    // FLAG: the form labels are not associated with their inputs, so the password fields are found by type
    await newUser.locator('input[type="password"]').nth(0).fill(password)
    await newUser.locator('input[type="password"]').nth(1).fill(password)
    await newUser.getByRole('button', { name: 'Create and close' }).click()
    await expect(toast(this.page, 'User created')).toBeVisible()
    await expect(newUser).toBeHidden()
  }

  async deleteUser(name: string) {
    await this.filter(name)
    await this.row(name).click({ button: 'right' })
    await menuItem(this.page, 'Delete selected').click()
    const confirm = dialog(this.page, `Delete ${name}`)
    await expect(confirm).toBeVisible()
    await confirm.getByTestId('delete-user-dialog-input').fill(name)
    await confirm.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(toast(this.page, 'Deleted 1 user(s)')).toBeVisible()
  }
}
