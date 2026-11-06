import { expect, Page } from '@playwright/test'
import { dialog, formRow } from '@ynput/ayon-e2e'

/** The open tags dropdown of a table cell or of the details panel */
export class TagsDropdown {
  constructor(readonly page: Page) {}

  get options() {
    return this.page.locator('.options')
  }

  /** A tag that isn't in the project yet: managers add it to the project's tags in a dialog */
  async createTag(name: string) {
    const search = this.page.locator('.search').getByRole('textbox')
    await search.click()
    await expect(search).toBeFocused()
    await search.fill(name)
    await search.press('Enter')

    const addTag = dialog(this.page, 'Add tag')
    await expect(formRow(addTag, 'Name').getByRole('textbox')).toHaveValue(name)
    await addTag.getByRole('button', { name: /Add$/ }).click()
    await expect(addTag).toBeHidden()
    // FLAG: options have no aria-checked; their checkbox icon's ligature shows the state
    await expect(
      this.options.locator(`[data-value="${name}"]`).first().locator('.checkbox-icon'),
    ).toHaveText('check_box')
  }
}
