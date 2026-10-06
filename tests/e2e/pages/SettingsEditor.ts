import { expect, Page } from '@playwright/test'

export class SettingsEditor {
  constructor(readonly page: Page) {}

  // FLAG: section headers are plain divs; a click only selects them, the chevron (or a double click) toggles
  sectionHeader(title: string) {
    return this.page
      .locator('.panel-header')
      .filter({ has: this.page.getByRole('heading', { name: title, exact: true }) })
  }

  async expand(title: string) {
    const toggler = this.sectionHeader(title).locator('.panel-toggler')
    await expect(toggler).toHaveText(/^(chevron_right|expand_more)$/)
    if ((await toggler.textContent()) === 'chevron_right') await toggler.click()
    await expect(toggler).toHaveText('expand_more')
  }

  // FLAG: field labels are not associated with their inputs, so `getByLabel` does not work
  field(schemaId: string) {
    return this.page.locator(`[data-schema-id="${schemaId}"]`)
  }
}
