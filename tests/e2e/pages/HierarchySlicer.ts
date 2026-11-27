import { expect, Locator, Page } from '@playwright/test'

/**
 * The hierarchy slicer: the folder tree on the left of project pages (overview, products, ...).
 * Its rows have DOM ids prefixed `slicer-<panelId>-`, which keeps them apart from the page's main table.
 */
export class HierarchySlicer {
  /** the panel's header: the search button, and the search row below it while open */
  readonly header: Locator

  constructor(readonly page: Page) {
    this.header = page.locator('.slicer-header')
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
    return this.header.getByPlaceholder('Search')
  }

  // the header's search button opens the search row and closes it again
  searchButton() {
    return this.header.getByRole('button', { name: 'search', exact: true })
  }

  async openSearch() {
    await this.searchButton().click()
    await expect(this.searchInput()).toBeFocused()
  }

  async closeSearch() {
    await this.searchButton().click()
    await expect(this.searchInput()).toBeHidden()
  }
}
