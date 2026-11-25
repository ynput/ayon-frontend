import { expect } from '@playwright/test'
import { DetailsPanel } from './DetailsPanel'

export class ReviewablesTab {
  constructor(readonly panel: DetailsPanel) {}

  async open() {
    await this.panel.openTab('files')
    await expect(this.section).toBeVisible()
  }

  get section() {
    return this.panel.root.getByTestId('details-panel-reviewables')
  }

  // FLAG: the cards are plain divs whose id is the file id; they have no role or name
  card(fileId: string) {
    return this.section.locator(`[id="${fileId}"]`)
  }

  get cards() {
    return this.section.locator('[id]:has(> * > .name)')
  }
}
