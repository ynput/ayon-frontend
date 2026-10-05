import { expect, Page } from '@playwright/test'
import { dialog, formRow, menuItem, switchBody, toast } from '../support/ui'

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

  /**
   * Assert whether a user row is selected.
   * FLAG: primereact DataTable rows do not set aria-selected, selection is only the `p-highlight` class
   */
  async expectSelected(name: string, selected = true) {
    if (selected) await expect(this.row(name)).toHaveClass(/\bp-highlight\b/)
    else await expect(this.row(name)).not.toHaveClass(/\bp-highlight\b/)
  }

  /** Select a single user (opens the details panel) */
  async select(name: string) {
    await this.row(name).click()
    await this.expectSelected(name)
  }

  /** Add a user to the current selection */
  async addToSelection(name: string) {
    await this.row(name).click({ modifiers: ['ControlOrMeta'] })
    await this.expectSelected(name)
  }

  async openContextMenu(name: string) {
    await this.row(name).click({ button: 'right' })
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

  /** Deletes all selected users through the context menu of one of them */
  async deleteSelectedUsers(rightClicked: string, count: number) {
    await this.openContextMenu(rightClicked)
    await menuItem(this.page, 'Delete selected').click()
    const confirm = dialog(this.page, `Delete ${count} Users`)
    await expect(confirm).toBeVisible()
    await confirm.getByTestId('delete-user-dialog-input').fill('delete selected')
    await confirm.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(toast(this.page, `Deleted ${count} user(s)`)).toBeVisible()
  }

  /** "Set password" from the context menu of `name` */
  async setPasswordFromMenu(name: string, password: string) {
    await this.openContextMenu(name)
    await menuItem(this.page, 'Set password').click()
    // the header names the user the password is set for
    const setPassword = dialog(this.page, `Set password for: ${name}`)
    await expect(setPassword).toBeVisible()
    // FLAG: the form labels are not associated with their inputs, so the password fields are found by type
    await setPassword.locator('input[type="password"]').nth(0).fill(password)
    await setPassword.locator('input[type="password"]').nth(1).fill(password)
    await setPassword.getByRole('button', { name: 'Set Password' }).click()
    await expect(toast(this.page, 'Password changed')).toBeVisible()
    await expect(setPassword).toBeHidden()
  }

  // details panel of the selected user(s)

  get activeRow() {
    return formRow(this.page, 'User active')
  }

  /** Flip "User active" in the details panel to `active` (saved with `save()`) */
  async setActive(active: boolean) {
    const checkbox = this.activeRow.getByRole('checkbox')
    // also waits for the form of the selected user to load
    await expect(checkbox).toBeChecked({ checked: !active })
    await switchBody(this.activeRow).click()
    await expect(checkbox).toBeChecked({ checked: active })
  }

  /** "User", "Manager" or "Admin" in the details panel (saved with `save()`) */
  async setAccessLevel(level: 'User' | 'Manager' | 'Admin') {
    const button = formRow(this.page, 'Access level').getByRole('button', { name: level })
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
  }

  async save() {
    await this.page.getByRole('button', { name: 'Save selected users' }).click()
    await expect(toast(this.page, /Updated users? successfully/)).toBeVisible()
  }
}
