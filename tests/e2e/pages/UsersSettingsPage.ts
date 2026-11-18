import { expect, Page } from '@playwright/test'
import { dialog, formRow, menuItem, runPrefix, switchBody, toast } from '@ynput/ayon-e2e'

/** /settings/users */
export class UsersSettingsPage {
  constructor(readonly page: Page) {}

  /**
   * Opens the page filtered to the users this run created. The table only renders the rows in
   * view, so on a server with many users the others are not in the page.
   */
  async goto({ filter = runPrefix() }: { filter?: string } = {}) {
    await this.page.goto('/settings/users')
    await expect(this.page.getByPlaceholder('Filter users...')).toBeVisible({ timeout: 30_000 })
    if (filter) await this.filter(filter)
  }

  get table() {
    return this.page
      .getByRole('table')
      .filter({ has: this.page.getByRole('columnheader', { name: 'Username' }) })
  }

  async sort(header: string, direction: string) {
    const column = this.table.getByRole('columnheader', { name: header, exact: true })
    await column.getByText(header, { exact: true }).click()
    await expect(column).toHaveAttribute('aria-sort', direction)
  }

  async columnNames() {
    return this.table.getByRole('columnheader').allTextContents()
  }

  async reorderColumn(source: string, target: string) {
    await this.table
      .getByRole('columnheader', { name: source, exact: true })
      .dragTo(this.table.getByRole('columnheader', { name: target, exact: true }))
  }

  async visibleNames() {
    return this.table.locator('tbody tr td:first-child').allInnerTexts()
  }

  async previewImport(name: string, buffer: Buffer) {
    await this.page.getByTestId('table-import-export').click()
    await this.page.getByTestId('import-file').click()
    const wizard = dialog(this.page, /Import users/)
    await expect(wizard).toBeVisible()
    await wizard.locator('input[type="file"]').setInputFiles({ name, mimeType: 'text/csv', buffer })
    await expect(wizard.getByText(/1 rows found/)).toBeVisible()
    await wizard.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(wizard.getByRole('columnheader', { name: 'File column' })).toBeVisible()
    await wizard.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(wizard.getByRole('columnheader', { name: 'Mapped Value' })).toBeVisible()
    await wizard.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(wizard.getByText('Updating: 1')).toBeVisible()
    await expect(wizard.getByRole('button', { name: 'Import data', exact: true })).toBeEnabled()
    await expect(wizard).toContainText(/Errors:\s*0/)
    await wizard.getByRole('button', { name: 'close', exact: true }).click()
    await expect(wizard).toBeHidden()
  }

  async filter(text: string) {
    await this.page.getByPlaceholder('Filter users...').fill(text)
  }

  row(name: string) {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  // FLAG: primereact DataTable rows do not set aria-selected, selection is only the `p-highlight` class
  async expectSelected(name: string, selected = true) {
    if (selected) await expect(this.row(name)).toHaveClass(/\bp-highlight\b/)
    else await expect(this.row(name)).not.toHaveClass(/\bp-highlight\b/)
  }

  async select(name: string) {
    await this.row(name).click()
    await this.expectSelected(name)
  }

  async addToSelection(name: string) {
    await this.row(name).click({ modifiers: ['ControlOrMeta'] })
    await this.expectSelected(name)
  }

  async openContextMenu(name: string) {
    await this.row(name).click({ button: 'right' })
    await expect(menuItem(this.page, 'Delete selected')).toBeVisible()
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

  /** "Delete selected" in the open context menu of `name`, which is the only user it deletes */
  async deleteUserFromMenu(name: string) {
    await menuItem(this.page, 'Delete selected').click()
    const confirm = dialog(this.page, `Delete ${name}`)
    await expect(confirm).toBeVisible()
    await confirm.getByTestId('delete-user-dialog-input').fill(name)
    await confirm.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(toast(this.page, 'Deleted 1 user(s)')).toBeVisible()
  }

  async deleteSelectedUsers(rightClicked: string, count: number) {
    await this.openContextMenu(rightClicked)
    await menuItem(this.page, 'Delete selected').click()
    const confirm = dialog(this.page, `Delete ${count} Users`)
    await expect(confirm).toBeVisible()
    await confirm.getByTestId('delete-user-dialog-input').fill('delete selected')
    await confirm.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(toast(this.page, `Deleted ${count} user(s)`)).toBeVisible()
  }

  /** "Set password" in the open context menu of `name` */
  async setPasswordFromMenu(name: string, password: string) {
    await menuItem(this.page, 'Set password').click()
    const setPassword = dialog(this.page, `Set password for: ${name}`)
    await expect(setPassword).toBeVisible()
    // FLAG: the form labels are not associated with their inputs, so the password fields are found by type
    await setPassword.locator('input[type="password"]').nth(0).fill(password)
    await setPassword.locator('input[type="password"]').nth(1).fill(password)
    await setPassword.getByRole('button', { name: 'Set Password' }).click()
    await expect(toast(this.page, 'Password changed')).toBeVisible()
    await expect(setPassword).toBeHidden()
  }

  get activeRow() {
    return formRow(this.page, 'User active')
  }

  async setActive(active: boolean) {
    const checkbox = this.activeRow.getByRole('checkbox')
    await expect(checkbox).toBeChecked({ checked: !active })
    await switchBody(this.activeRow).click()
    await expect(checkbox).toBeChecked({ checked: active })
  }

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
