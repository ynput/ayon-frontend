import { expect, Locator, Page } from '@playwright/test'

export class MentionPicker {
  constructor(readonly page: Page, readonly editor: Locator) {}

  get title() {
    return this.page.getByText('@ Mention', { exact: true })
  }

  get list() {
    return this.page.getByRole('listbox', { name: '', exact: true })
  }

  get options() {
    return this.list.getByRole('option')
  }

  option(text: string) {
    return this.options.filter({ hasText: text })
  }

  async search(query: string) {
    await this.editor.press('ControlOrMeta+a')
    await this.editor.pressSequentially(`@${query}`)
    await expect(this.title).toBeVisible()
  }

  async filter(type: 'users' | 'teams' | 'tasks' | 'folders' | 'versions') {
    await this.page.getByRole('button', { name: `Filter ${type}`, exact: true }).click()
  }
}
