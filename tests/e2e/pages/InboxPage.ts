import { expect, Locator, Page } from '@playwright/test'
import { menuItem } from '../support/ui'

export class InboxPage {
  constructor(readonly page: Page) {}

  async goto(tab: 'important' | 'other' | 'cleared', projectName?: string) {
    const query = projectName ? `?inboxProject=${encodeURIComponent(projectName)}` : ''
    await this.page.goto(`/inbox/${tab}${query}`)
    await expect(this.page.getByRole('button', { name: /^refresh Refresh/ })).toBeVisible({
      timeout: 30_000,
    })
  }

  /** search needs a project, see `goto` */
  async search(text: string) {
    await this.page.getByRole('textbox', { name: 'Search and filter' }).click()
    await this.page.keyboard.type(text)
    // Cmd/Ctrl+Enter adds the text as a search even when a filter name contains it
    await this.page.keyboard.press('ControlOrMeta+Enter')
  }

  get messages(): Locator {
    return this.page.locator('.inbox-message')
  }

  message(text: string | RegExp): Locator {
    return this.messages.filter({ hasText: text })
  }

  get allCaughtUp(): Locator {
    return this.page.getByText('All caught up! No messages to show.')
  }

  // FLAG: the read state is only the `isRead` class, there is no accessible state
  async expectRead(message: Locator, read: boolean) {
    if (read) await expect(message).toHaveClass(/\bisRead\b/)
    else await expect(message).not.toHaveClass(/\bisRead\b/)
  }

  async messageAction(message: Locator, action: string) {
    await message.click({ button: 'right' })
    await menuItem(this.page, action).click()
  }

  async clearAll() {
    await this.page.getByRole('button', { name: /^done_all Clear all/ }).click()
  }
}
