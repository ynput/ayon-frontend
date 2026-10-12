import { expect, Locator, Page } from '@playwright/test'
import { menuItem } from '../support/ui'

export class InboxPage {
  constructor(readonly page: Page) {}

  async goto(tab: 'important' | 'other' | 'cleared') {
    await this.page.goto(`/inbox/${tab}`)
    await expect(this.page.getByRole('button', { name: /^refresh Refresh/ })).toBeVisible({
      timeout: 30_000,
    })
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
