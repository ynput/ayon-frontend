import { expect, Page } from '@playwright/test'

/** /dashboard/projects — the projects table (ListTable) with a details panel for the selection */
export class DashboardProjectsPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto('/dashboard/projects')
    await expect(this.page.getByRole('button', { name: /Create new project$/ })).toBeVisible({
      timeout: 30_000,
    })
  }

  /** Other tests create projects in parallel, so the page only gets these from the server */
  async onlyShow(names: string[]) {
    await this.page.route('**/graphql', async (route) => {
      if (!route.request().postData()?.includes('query GetProjects(')) return route.continue()
      const response = await route.fetch()
      const json = await response.json()
      json.data.projects.edges = json.data.projects.edges.filter((edge: any) =>
        names.includes(edge.node.name),
      )
      await route.fulfill({ response, json })
    })
  }

  row(name: string) {
    return this.page.locator('tr.table-list-row').filter({ hasText: name })
  }

  // FLAG: ListTable rows have no aria-selected; selection is the `selected` class
  async expectSelection(selected: string[], notSelected: string[] = []) {
    for (const name of selected) await expect(this.row(name)).toHaveClass(/\bselected\b/)
    for (const name of notSelected) await expect(this.row(name)).not.toHaveClass(/\bselected\b/)
  }
}
