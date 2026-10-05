import { expect, Page } from '@playwright/test'

/**
 * The schema driven settings form (src/containers/SettingsEditor). It renders access group
 * permissions, anatomy (presets and project anatomy) and addon settings.
 */
export class SettingsEditor {
  constructor(readonly page: Page) {}

  /**
   * Header of a collapsible section, by its title.
   * FLAG: section headers are plain divs, not buttons or disclosure widgets; a single click only
   * selects them, the chevron icon (or a double click) toggles them.
   */
  sectionHeader(title: string) {
    return this.page
      .locator('.panel-header')
      .filter({ has: this.page.getByRole('heading', { name: title, exact: true }) })
  }

  /** Expand a section (expanded sections are remembered per browser session) */
  async expand(title: string) {
    const toggler = this.sectionHeader(title).locator('.panel-toggler')
    await expect(toggler).toHaveText(/^(chevron_right|expand_more)$/)
    if ((await toggler.textContent()) === 'chevron_right') await toggler.click()
    await expect(toggler).toHaveText('expand_more')
  }

  /**
   * A field by its schema path, e.g. `root_attributes_fps`.
   * FLAG: field labels are not associated with their inputs, so `getByLabel` does not work.
   */
  field(schemaId: string) {
    return this.page.locator(`[data-schema-id="${schemaId}"]`)
  }
}
