import { expect, Page } from '@playwright/test'
import { confirmDialog, dialog, menuItem, toast } from '../support/ui'

/** /projects/:project/lists */
export class ListsPage {
  constructor(readonly page: Page) {}

  async goto(project: string) {
    await this.page.goto(`/projects/${project}/lists`)
    await expect(this.addListButton).toBeVisible({ timeout: 30_000 })
  }

  get addListButton() {
    return this.page.locator('button.add-list')
  }

  listRow(label: string) {
    return this.page.getByRole('row').filter({ hasText: label }).first()
  }

  async createList({ label, entityType }: { label: string; entityType?: string }) {
    await this.addListButton.click()
    const newList = dialog(this.page, 'Create New List')
    await expect(newList).toBeVisible()
    await newList.getByLabel('List label').fill(label)
    if (entityType) {
      // FLAG: <label for="entityType"> points at nothing, the Dropdown has no matching id
      await newList.locator('label[for="entityType"] + *').getByRole('button').click()
      await this.page.locator(`.options [data-value="${entityType}"]`).click()
    }
    await newList.getByRole('button', { name: 'Create list' }).click()
    await expect(newList).toBeHidden()
  }

  async renameList(label: string, newLabel: string) {
    await this.listRow(label).click({ button: 'right' })
    await menuItem(this.page, 'Rename list').click()
    // the only input inside a table row is the rename input
    const input = this.page.getByRole('row').getByRole('textbox')
    await expect(input).toBeFocused()
    await input.fill(newLabel)
    await input.press('Enter')
    await expect(input).toBeHidden()
  }

  async openList(label: string) {
    await this.listRow(label).click()
    await expect(this.itemsTable).toBeVisible()
  }

  get itemsTable() {
    return this.page
      .getByRole('table')
      .filter({ has: this.page.getByRole('columnheader', { name: 'Thumbnail' }) })
  }

  itemNameCell(label: string) {
    return this.itemsTable.locator('td.name').filter({ hasText: label })
  }

  async removeItem(label: string) {
    const cell = this.itemNameCell(label)
    await cell.click()
    await cell.click({ button: 'right' })
    await menuItem(this.page, 'Remove from list').click()
    await confirmDialog(this.page).getByRole('button', { name: 'Remove' }).click()
    await expect(toast(this.page, 'Deleted 1 item from list')).toBeVisible()
  }

  async openDetails(label: string) {
    await this.listRow(label).dblclick()
    await expect(this.page.getByRole('heading', { name: label, level: 2 })).toBeVisible()
  }

  detail(name: string) {
    return this.page.getByText(name, { exact: true }).locator('xpath=following-sibling::*[1]')
  }

  async deleteList(label: string) {
    await this.listRow(label).click({ button: 'right' })
    await menuItem(this.page, 'Delete').click()
    await confirmDialog(this.page).getByRole('button', { name: 'Delete' }).click()
    await expect(toast(this.page, `list "${label}" deleted`)).toBeVisible()
  }
}

/** The "Add to list" dialog opened from any entity context menu */
export const addToList = async (page: Page, listLabel: string) => {
  const addDialog = dialog(page, 'Add to list')
  await expect(addDialog).toBeVisible()
  await addDialog.getByRole('row').filter({ hasText: listLabel }).click()
  await addDialog.getByRole('button', { name: 'Add to list' }).click()
  await expect(addDialog).toBeHidden()
}
