import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

class DashboardTasksPage {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto(`/dashboard/tasks`)
  }
  async gotoListView() {
    await this.page.goto(`/dashboard/tasks?view=list`)
  }
}

const test = base.extend<{ dashboardTaskPage: DashboardTasksPage }>({
  dashboardTaskPage: async ({ page }, use) => {
    const _page = new DashboardTasksPage(page)
    await use(_page)
  },
})

export default DashboardTasksPage

export { test as dashboardTaskTest }
