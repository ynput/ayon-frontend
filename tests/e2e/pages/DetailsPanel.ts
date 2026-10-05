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

  /**
   * The priority dropdown on the right of the header.
   * FLAG: it has no label or class of its own (only its icon and value), so it is found as the header
   * dropdown that is neither the status nor the assignee select.
   */
  get priorityDropdown() {
    return this.root.locator(
      '.details-panel-header > .dropdown:not(.status-select):not(.assignee-select)',
    )
  }

  /** Pick a priority by its value (e.g. `high`) and wait for its label to show */
  async setPriority(value: string, label: string) {
    await this.priorityDropdown.click()
    await this.page.locator(`.options [data-value="${value}"]`).first().click()
    await expect(this.priorityDropdown).toContainText(label)
  }

  get assigneeSelect() {
    return this.root.locator('.assignee-select').first()
  }

  /** Toggle users (by user name) in the assignee dropdown, then close it */
  async toggleAssignees(...userNames: string[]) {
    await this.assigneeSelect.click()
    for (const name of userNames) {
      await this.page.locator(`.options [data-value="${name}"]`).first().click()
    }
    // click outside to close: Escape also reaches the overview table, which clears its selection
    // and with it closes the panel
    await this.root.getByRole('heading', { level: 2 }).click()
    await expect(this.page.locator('.options')).toBeHidden()
  }

  // ---------------------------------------------------------------------------
  // tabs
  // ---------------------------------------------------------------------------

  /**
   * Switch between the panel tabs.
   * FLAG: the feed and subtasks tabs are icon-only buttons (accessible names "forum" and "checklist").
   */
  async openTab(tab: 'feed' | 'subtasks' | 'details') {
    const name = { feed: 'forum', subtasks: 'checklist', details: 'Details' }[tab]
    await this.root.getByRole('navigation').getByRole('button', { name, exact: true }).click()
  }

  // ---------------------------------------------------------------------------
  // details tab
  // ---------------------------------------------------------------------------

  /** the read-only view of the description in the details tab (a Lexical editor) */
  get description() {
    return this.root.locator('.description-editor').first()
  }

  /** Click the description, replace its text and save */
  async editDescription(text: string) {
    await this.description.click()
    const save = this.root.getByRole('button', { name: 'Save', exact: true })
    await expect(save).toBeVisible()
    const editor = this.description.locator('[contenteditable="true"]')
    await expect(editor).toBeFocused()
    await editor.press('ControlOrMeta+a')
    await editor.pressSequentially(text)
    await save.click()
    await expect(save).toBeHidden()
  }

  /**
   * One row of the attributes section, by its label (e.g. "FPS").
   * FLAG: the label is a plain div that is not associated with the value, so the row is found by CSS.
   */
  attribute(label: string) {
    return this.root
      .locator('.field-row')
      .filter({ has: this.page.locator('.field-label', { hasText: new RegExp(`^${label}$`) }) })
      .locator('.field-value')
  }

  /** Edit a text or number attribute: click its value, type the new one and press Enter */
  async setAttribute(label: string, value: string) {
    const field = this.attribute(label)
    await field.click()
    const input = field.locator('input')
    await expect(input).toBeFocused()
    await input.fill(value)
    await input.press('Enter')
    await expect(input).toBeHidden()
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

  /** One entry of the feed (a comment, a status change, ...) containing `text` */
  activity(text: string | RegExp) {
    return this.root.locator('.feed').getByRole('listitem').filter({ hasText: text })
  }

  /** The checkbox of a checklist item (`* [ ] item` in markdown) inside a comment */
  checklistItem(commentText: string, item: string) {
    return this.comment(commentText)
      .getByRole('listitem')
      .filter({ hasText: item })
      .getByRole('checkbox')
  }

  /**
   * Tick or untick a checklist item.
   * FLAG: the native checkbox is 0x0 and invisible and its `<label>` has no size either; only the
   * absolutely positioned icon inside the label can be clicked.
   */
  async toggleChecklistItem(commentText: string, item: string) {
    await this.comment(commentText)
      .getByRole('listitem')
      .filter({ hasText: item })
      .locator('label .icon')
      .click()
  }

  /**
   * Quick filters next to the feed search.
   * FLAG: they are icon-only buttons, so their names are the icon ligatures ("chat", "check_circle");
   * the checklists one also shows the ticked/total count, e.g. "check_circle 1/2".
   */
  get commentsFilter() {
    return this.root.locator('.feed').getByRole('button', { name: 'chat', exact: true })
  }

  get checklistsFilter() {
    return this.root.locator('.feed').getByRole('button', { name: /^check_circle \d+\/\d+$/ })
  }
}
