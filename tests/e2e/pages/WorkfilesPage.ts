import { expect, Locator, Page } from '@playwright/test'
import { confirmDialog, menuItem, toast } from '../support/ui'

export class WorkfilesPage {
  constructor(readonly page: Page) {}

  async goto(project: string) {
    await this.page.goto(`/projects/${project}/workfiles`)
    await expect(this.page.getByPlaceholder('Filter folders...')).toBeVisible({ timeout: 30_000 })
  }

  row(text: string): Locator {
    return this.page.getByRole('row').filter({ hasText: text })
  }

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
