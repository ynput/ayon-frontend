import { expect, Locator, Page } from '@playwright/test'

/** /projects/:project/tasks — one row per folder, one column per task type */
export class TasksProgressPage {
  constructor(readonly page: Page) {}

  async goto(project: string) {
    await this.page.goto(`/projects/${project}/tasks`)
    await expect(this.page.getByRole('button', { name: 'Expand all rows' })).toBeVisible({
      timeout: 30_000,
    })
  }

  /** Pick a folder in the hierarchy on the left; its descendants show in the table */
  async selectFolder(label: string) {
    await this.page.getByRole('table').first().getByText(label, { exact: true }).click()
  }

  folderRow(label: string): Locator {
    return this.page.locator('.tasks-progress-table tr').filter({ hasText: label }).last()
  }

  /** The task cell of a folder row (cells carry the task label as tooltip) */
  taskCell(folderLabel: string, taskLabel: string): Locator {
    return this.folderRow(folderLabel).locator(`.cell[data-tooltip="${taskLabel}"]`)
  }

  async setStatus(folderLabel: string, taskLabel: string, to: string) {
    const cell = this.taskCell(folderLabel, taskLabel)
    // edits only apply to selected cells
    await cell.click()
    await expect(cell).toHaveClass(/selected/)
    await cell.locator('.tag.status.editable').click()
    await this.page.locator(`[data-value="${to}"]`).first().click()
    await expect(cell).toContainText(to)
  }
}
