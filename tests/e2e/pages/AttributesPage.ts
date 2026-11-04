import { expect, Page } from '@playwright/test'

/** /settings/attributes — the studio attribute library. Tests must never save it. */
export class AttributesPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto('/settings/attributes')
    await expect(this.page.getByPlaceholder('Filter attributes...')).toBeVisible()
  }

  async filter(text: string) {
    await this.page.getByPlaceholder('Filter attributes...').fill(text)
  }

  row(name: string) {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name, exact: true }) })
  }

  // FLAG: primereact DataTable rows do not set aria-selected, selection is only the `p-highlight` class
  async expectSelected(name: string, selected = true) {
    if (selected) await expect(this.row(name)).toHaveClass(/\bp-highlight\b/)
    else await expect(this.row(name)).not.toHaveClass(/\bp-highlight\b/)
  }

  async select(name: string) {
    await this.row(name).click()
    await this.expectSelected(name)
  }
}
