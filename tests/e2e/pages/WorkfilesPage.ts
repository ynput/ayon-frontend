import { expect, Locator, Page } from '@playwright/test'
import { confirmDialog, menuItem, toast } from '../support/ui'

/**
 * /projects/:project/workfiles — folders, then the tasks of the selected folder,
 * then the workfiles of the selected task, then the selected workfile's details.
 * Rows are found by text, so give folders, tasks and workfiles names that do not contain each other.
 */
export class WorkfilesPage {
  constructor(readonly page: Page) {}

  async goto(project: string) {
    await this.page.goto(`/projects/${project}/workfiles`)
    await expect(this.page.getByPlaceholder('Filter folders...')).toBeVisible({ timeout: 30_000 })
  }

  row(text: string): Locator {
    return this.page.getByRole('row').filter({ hasText: text })
  }

  /** Select a folder in the hierarchy, then one of its tasks */
  async openTask(folderLabel: string, taskLabel: string) {
    await this.row(folderLabel).click()
    await expect(this.row(taskLabel)).toBeVisible()
    await this.row(taskLabel).click()
  }

  async deleteWorkfile(name: string) {
    await this.row(name).click({ button: 'right' })
    await menuItem(this.page, 'Delete File').click()
    const confirm = confirmDialog(this.page)
    await expect(confirm).toContainText(name)
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(toast(this.page, `${name} deleted`)).toBeVisible()
  }
}
