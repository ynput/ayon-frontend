import { expect, Page } from '@playwright/test'

/**
 * The project list side panel (src/containers/ProjectsList), used by the projects manager,
 * the dashboard and the project switcher. Other tests create projects in parallel, so always
 * search for the project instead of relying on its position.
 */
export class ProjectsList {
  constructor(readonly page: Page) {}

  async search(text: string) {
    const input = this.page.getByPlaceholder('Search', { exact: true })
    if (!(await input.isVisible())) {
      await this.page.getByRole('button', { name: 'search', exact: true }).first().click()
    }
    await input.fill(text)
  }

  row(name: string, { exact = false } = {}) {
    return this.page
      .getByRole('row')
      .filter(exact ? { has: this.page.getByText(name, { exact: true }) } : { hasText: name })
  }

  // FLAG: SimpleTable rows have no aria-selected; being selected is a class of the cell content
  async expectSelection(selected: string[], notSelected: string[] = []) {
    for (const name of selected) {
      await expect(this.row(name, { exact: true }).locator('.selected')).toBeVisible()
    }
    for (const name of notSelected) {
      await expect(this.row(name, { exact: true }).locator('.selected')).toBeHidden()
    }
  }

  async select(name: string) {
    await this.search(name)
    await expect(this.row(name)).toBeVisible()
    await this.row(name).click()
  }

  async openContextMenu(name: string) {
    await this.search(name)
    await expect(this.row(name)).toBeVisible()
    await this.row(name).click({ button: 'right' })
  }
}
