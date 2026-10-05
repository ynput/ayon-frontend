import { expect } from '@playwright/test'
import { DetailsPanel } from './DetailsPanel'

/**
 * The files tab of a version's details panel: the version's reviewables (with their status) and
 * representations. Playable reviewables are cards with the label and file name, files that cannot
 * be played say e.g. "Unsupported - conversion required".
 */
export class ReviewablesTab {
  constructor(readonly panel: DetailsPanel) {}

  /**
   * FLAG: the tab buttons are icon-only; the files tab is named by its icon ligature "order_play".
   */
  async open() {
    await this.panel.root
      .getByRole('navigation')
      .getByRole('button', { name: 'order_play', exact: true })
      .click()
    await expect(this.section).toBeVisible()
  }

  /** the "Reviewables" section (heading, cards and upload area) */
  get section() {
    return this.panel.root
      .getByRole('heading', { name: 'Reviewables', level: 4 })
      .locator('xpath=..')
  }

  /**
   * One reviewable card by its file id.
   * FLAG: the cards are plain divs whose id is the file id; they have no role or name.
   */
  card(fileId: string) {
    return this.section.locator(`[id="${fileId}"]`)
  }

  /** every reviewable card, playable or not (each has one file name line) */
  get cards() {
    return this.section.locator('[id]:has(> * > .name)')
  }
}
