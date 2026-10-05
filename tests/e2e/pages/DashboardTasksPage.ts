import { expect, Locator, Page } from '@playwright/test'
import { ProjectsList } from './ProjectsList'

/** /dashboard/tasks — "my tasks" across projects, as a kanban board or a list */
export class DashboardTasksPage {
  readonly projects: ProjectsList

  constructor(readonly page: Page) {
    this.projects = new ProjectsList(page)
  }

  async goto() {
    await this.page.goto('/dashboard/tasks')
    await expect(this.page.getByPlaceholder('Filter tasks...')).toBeVisible({ timeout: 30_000 })
  }

  /** Show only the tasks of one project */
  async selectProject(name: string) {
    await this.projects.select(name)
  }

  /** Narrow the tasks down by name, folder, type, status, path or assignee */
  async filter(text: string) {
    await this.page.getByPlaceholder('Filter tasks...').fill(text)
  }

  /** A kanban card; its element id is the task id */
  card(taskId: string): Locator {
    return this.page.locator(`[id="${taskId}"]`)
  }

  // ---------------------------------------------------------------------------
  // list view
  // ---------------------------------------------------------------------------

  async showList() {
    await this.page.getByRole('button', { name: 'format_list_bulleted List', exact: true }).click()
    await expect(this.page.locator('.tasks-list')).toBeVisible()
  }

  /**
   * A row of the list view; like a card, its element id is the task id.
   * FLAG: rows are plain `li`s of unlabeled widgets, so their parts are found by class.
   */
  listRow(taskId: string): Locator {
    return this.page.locator(`.tasks-list li[id="${taskId}"]`)
  }

  /**
   * The status of a list row.
   * FLAG: the list shows the status as a bare icon with no accessible name or tooltip,
   * the status name is only in the `id` of the status field.
   */
  listRowStatus(taskId: string): Locator {
    return this.listRow(taskId).locator('.status-field').first()
  }

  async setStatusInList(taskId: string, status: string) {
    const row = this.listRow(taskId)
    // fields of a row edit every selected row, so select just this one first
    // (on the task label: the middle of the row can be one of its dropdowns)
    await row.locator('.task-label').click()
    await expect(row).toHaveClass(/selected/)
    await this.listRowStatus(taskId).click()
    await this.page.locator(`.options [data-value="${status}"]`).click()
  }

  /** The heading ("In progress - 2") of the column a card is in */
  columnHeadingOf(taskId: string): Locator {
    return this.card(taskId).locator('xpath=ancestor::*[.//h2][1]//h2')
  }

  /** Drag a card onto another status (dnd-kit needs real pointer moves) */
  async dragCardToStatus(taskId: string, status: string) {
    const card = this.card(taskId)
    const box = (await card.boundingBox())!
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await this.page.mouse.down()
    // pass the pointer sensor activation distance before heading to the target
    await this.page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2, { steps: 5 })
    const target = this.page
      .locator('.dropzone .title')
      .filter({ hasText: new RegExp(`^${status}$`) })
    await expect(target).toBeVisible()
    const targetBox = (await target.boundingBox())!
    await this.page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      {
        steps: 15,
      },
    )
    await this.page.mouse.up()
  }
}
