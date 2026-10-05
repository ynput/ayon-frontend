import { expect, Locator, Page } from '@playwright/test'
import { confirmDialog, menuItem } from '../support/ui'

/**
 * The entity details panel (header with status/assignees + activity feed).
 * Shared by overview, task progress, products, dashboard and inbox.
 */
export class DetailsPanel {
  readonly root: Locator

  constructor(readonly page: Page, root?: Locator) {
    this.root = root ?? page.locator('.details-panel').first()
  }

  async expectOpenFor(label: string) {
    await expect(this.root).toBeVisible()
    // tasks show the folder as the title and "Task - <label>" below it
    await expect(this.header).toContainText(label)
  }

  async close() {
    await this.root.getByRole('button', { name: 'close', exact: true }).first().click()
    await expect(this.root).toBeHidden()
  }

  // ---------------------------------------------------------------------------
  // header
  // ---------------------------------------------------------------------------

  get header() {
    return this.root.getByRole('heading', { level: 2 }).locator('xpath=../..')
  }

  get statusSelect() {
    return this.root.locator('.status-select').first()
  }

  async setStatus(status: string) {
    await this.statusSelect.click()
    await this.page.locator(`.options [data-value="${status}"]`).first().click()
    await expect(this.statusSelect).toContainText(status)
  }

  // ---------------------------------------------------------------------------
  // feed
  // ---------------------------------------------------------------------------

  /** the rich text editor of the comment box (Lexical contenteditable) */
  get commentEditor() {
    return this.root.locator('.comment-editor [contenteditable="true"]').first()
  }

  comment(text: string) {
    return this.root.locator('.comment').filter({ hasText: text })
  }

  async addComment(text: string) {
    // the comment box is collapsed until clicked
    await this.root.getByText(/^(Leave a comment|Comment, or type)/).click()
    await expect(this.commentEditor).toBeVisible()
    await this.commentEditor.pressSequentially(text)
    await this.root.getByRole('button', { name: 'Comment', exact: true }).click()
    await expect(this.comment(text)).toBeVisible()
  }

  /** Type a comment that mentions a user, picking them by full name from the @ suggestions */
  async addCommentMentioning(text: string, fullName: string) {
    await this.root.getByText(/^(Leave a comment|Comment, or type)/).click()
    await expect(this.commentEditor).toBeVisible()
    // the mention search stops at whitespace, so type the first name and pick from the list
    await this.commentEditor.pressSequentially(`${text} @${fullName.split(' ')[0]}`)
    await this.root.getByText(fullName, { exact: true }).click()
    await this.root.getByRole('button', { name: 'Comment', exact: true }).click()
  }

  async editComment(text: string, newText: string) {
    // pin the comment by its id (= activity id), its text changes while editing
    const id = await this.comment(text).getAttribute('id')
    const comment = this.root.locator(`.comment[id="${id}"]`)
    await comment.hover()
    await comment.getByRole('button', { name: 'edit_square' }).click()
    const editor = comment.locator('[contenteditable="true"]')
    await expect(editor).toBeVisible()
    await editor.press('ControlOrMeta+a')
    await editor.pressSequentially(newText)
    await comment.getByRole('button', { name: 'Save' }).click()
    await expect(this.comment(newText)).toBeVisible()
  }

  async deleteComment(text: string) {
    const comment = this.comment(text)
    await comment.hover()
    await comment.getByRole('button', { name: 'more_horiz' }).click()
    await menuItem(this.page, 'Delete').click()
    await confirmDialog(this.page).getByRole('button', { name: 'Delete' }).click()
    await expect(this.comment(text)).toBeHidden()
  }

  /** Toggle a reaction from the reaction picker of a comment */
  async react(text: string, emoji: string) {
    const comment = this.comment(text)
    await comment.hover()
    await comment.locator('.add-reaction').click()
    await this.page.locator('.emoji', { hasText: emoji }).first().click()
  }

  reaction(text: string, emoji: string) {
    return this.comment(text)
      .locator('div')
      .filter({ has: this.page.locator('.emoji', { hasText: emoji }) })
      .last()
  }
}
