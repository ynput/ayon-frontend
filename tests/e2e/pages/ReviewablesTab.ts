import { expect } from '@playwright/test'
import { DetailsPanel } from './DetailsPanel'

export class ReviewablesTab {
  constructor(readonly panel: DetailsPanel) {}

  // FLAG: the tab buttons are icon-only; the files tab is named by its icon ligature "order_play"
  async open() {
    await this.panel.root
      .getByRole('navigation')
      .getByRole('button', { name: 'order_play', exact: true })
      .click()
    await expect(this.section).toBeVisible()
  }

  get section() {
    return this.panel.root
      .getByRole('heading', { name: 'Reviewables', level: 4 })
      .locator('xpath=..')
  }

  // FLAG: the cards are plain divs whose id is the file id; they have no role or name
  card(fileId: string) {
    return this.section.locator(`[id="${fileId}"]`)
  }

  get cards() {
    return this.section.locator('[id]:has(> * > .name)')
  }
}
