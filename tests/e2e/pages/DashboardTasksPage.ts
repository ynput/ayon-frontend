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

  /** A kanban card; its element id is the task id */
  card(taskId: string): Locator {
    return this.page.locator(`[id="${taskId}"]`)
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
