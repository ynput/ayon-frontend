import { expect, Locator, Page } from '@playwright/test'

/**
 * The hierarchy slicer: the folder tree on the left of project pages (overview, products, ...).
 * Its rows have DOM ids prefixed `slicer-<panelId>-`, which keeps them apart from the page's main table.
 */
export class HierarchySlicer {
  readonly search: Locator

  constructor(readonly page: Page) {
    this.search = page.locator('.slicer-search')
  }

  row(label: string) {
    return this.page
      .locator('tr[id^="slicer-"]')
      .filter({ has: this.page.locator('.value').getByText(label, { exact: true }) })
  }

  expander(label: string) {
    return this.row(label).locator('.expander')
  }

  async toggle(label: string) {
    await this.expander(label).click()
  }

  async expectExpanded(label: string, expanded: boolean) {
    await expect(this.expander(label)).toHaveText(expanded ? 'expand_more' : 'chevron_right')
  }

  searchInput() {
    return this.search.getByPlaceholder('Search')
  }

  async openSearch() {
    await this.search.getByRole('button').click()
    await expect(this.searchInput()).toBeFocused()
  }

  async closeSearch() {
    await this.search.getByRole('button').click()
    await expect(this.searchInput()).toBeHidden()
  }
}
