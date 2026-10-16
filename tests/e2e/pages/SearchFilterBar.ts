import { expect, Locator, Page } from '@playwright/test'

export class SearchFilterBar {
  readonly root: Locator

  constructor(readonly page: Page) {
    this.root = page.locator('.search-filter')
  }

  // FLAG: the "Search and filter" dropdown is a plain list without menu roles, so items are found by label
  private option(label: string): Locator {
    return this.root
      .getByRole('listitem')
      .filter({ has: this.page.getByText(label, { exact: true }) })
      .first()
  }

  private async open() {
    // the "Search and filter" placeholder is gone once a filter is applied
    await this.root.getByRole('textbox').click()
  }

  async add(scope: string, field: string, value: string) {
    await this.open()
    for (const label of [scope, field, value]) {
      await this.option(label).click()
    }
  }

  async addText(scope: string, field: string, text: string) {
    await this.open()
    await this.option(scope).click()
    await this.option(field).click()
    // a free text value is typed into the new chip itself
    await this.root.locator('input:focus').fill(text)
    await this.page.keyboard.press('Enter')
  }

  // FLAG: filter chips have no role or accessible name, so they are found by their CSS class
  chip(label: string): Locator {
    return this.root.locator('.search-filter-item').filter({ hasText: `${label}:` })
  }

  async remove(label: string) {
    await this.chip(label).getByRole('button', { name: 'close', exact: true }).click()
    await expect(this.chip(label)).toBeHidden()
  }
}
