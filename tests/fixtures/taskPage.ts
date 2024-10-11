import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

const getTaskName = prefix => (browser) => prefix + '_' + browser

class TaskPage {
  constructor(public readonly page: Page) {}

  async goto(projectName) {
    await this.page.goto(`/projects/${projectName}/editor`)
  }

  async createTask(projectName, folderName, taskName) {
    await this.goto(projectName)
    await this.page.getByText(folderName).click()
    await this.page.getByRole('button', { name: 'add_task Add tasks' }).click()
    await this.page.getByText('task_altGeneric').click()
    const snoozeButton = await this.page.getByRole('button', {
      name: 'snooze Restart later (snooze)',
    })
    if (await snoozeButton.isVisible()) {
      await snoozeButton.click()
    }
    await this.page.locator('input[value="Generic"]').fill(taskName)
    await this.page.getByRole('button', { name: 'check Add and Close' }).click()
    await expect(this.page.getByRole('cell', { name: taskName })).toBeVisible()
    await this.page.getByRole('button', { name: 'check Save Changes' }).click()
    await this.page.getByText('Changes saved').click()
  }

  async deleteTask(projectName, folderName, taskName) {
    // Minor hack: Double navigation to actually load the editor page, it was giving inconsistent results without it.
    // await this.page.goto(`/`)
    // await this.page.goto(`/projects/${projectName}/editor`)

    var folderLocator = this.page.locator('.p-treetable-scrollable-body span').getByText(folderName)
    expect(folderLocator).toBeVisible()
    folderLocator.dblclick()

    await this.page.getByRole('cell', { name: taskName }).click({ button: 'right', force: true })
    await this.page.getByRole('menuitem', { name: 'delete Delete' }).click()
    await this.page.getByRole('button', { name: 'check Save Changes' }).click()
    await this.page.getByText('Changes saved').click()
    await expect(this.page.getByRole('cell', { name: taskName })).toBeHidden()
  }
}

const test = base.extend<{ taskPage: TaskPage }>({
  taskPage: async ({ page }, use) => {
    const taskpage = new TaskPage(page)
    await use(taskpage)
  },
})

export default TaskPage

export { getTaskName, test as taskTest }
