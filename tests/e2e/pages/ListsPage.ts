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
