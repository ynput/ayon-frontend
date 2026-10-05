import { expect, Locator, Page } from '@playwright/test'
import { menuItem } from '../support/ui'

/**
 * /inbox/:tab — the signed in user's notifications.
 * Use it as a regular user with access to the test project only (see "Cross-project queries"
 * in tests/AGENTS.md): a manager's inbox spans every project on the server.
 */
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

  /** A message row (one row groups the messages of one entity) */
  message(text: string | RegExp): Locator {
    return this.messages.filter({ hasText: text })
  }

  /** Shown when the tab has no messages */
  get allCaughtUp(): Locator {
    return this.page.getByText('All caught up! No messages to show.')
  }

  /**
   * Read rows are dimmed.
   * FLAG: the read state is only exposed as the `isRead` class, there is no accessible state.
   */
  async expectRead(message: Locator, read: boolean) {
    if (read) await expect(message).toHaveClass(/\bisRead\b/)
    else await expect(message).not.toHaveClass(/\bisRead\b/)
  }

  /** Right-click a row and pick an action, e.g. "Mark as read" or "Clear" */
  async messageAction(message: Locator, action: string) {
    await message.click({ button: 'right' })
    await menuItem(this.page, action).click()
  }

  async clearAll() {
    await this.page.getByRole('button', { name: /^done_all Clear all/ }).click()
  }
}
