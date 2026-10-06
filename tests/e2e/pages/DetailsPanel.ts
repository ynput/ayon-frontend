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

  // FLAG: the priority dropdown has no label or class, so it is the header dropdown that is not status/assignee
  get priorityDropdown() {
    return this.root.locator(
      '.details-panel-header > .dropdown:not(.status-select):not(.assignee-select)',
    )
  }

  async setPriority(value: string, label: string) {
    await this.priorityDropdown.click()
    await this.page.locator(`.options [data-value="${value}"]`).first().click()
    await expect(this.priorityDropdown).toContainText(label)
  }

  get assigneeSelect() {
    return this.root.locator('.assignee-select').first()
  }

  async toggleAssignees(...userNames: string[]) {
    await this.assigneeSelect.click()
    for (const name of userNames) {
      await this.page.locator(`.options [data-value="${name}"]`).first().click()
    }
    // click outside to close: Escape also reaches the overview table, which clears the selection and the panel
    await this.root.getByRole('heading', { level: 2 }).click()
    await expect(this.page.locator('.options')).toBeHidden()
  }

  // FLAG: the feed and subtasks tabs are icon-only buttons (accessible names "forum" and "checklist")
  async openTab(tab: 'feed' | 'subtasks' | 'details') {
    const name = { feed: 'forum', subtasks: 'checklist', details: 'Details' }[tab]
    await this.root.getByRole('navigation').getByRole('button', { name, exact: true }).click()
  }

  get description() {
    return this.root.locator('.description-editor').first()
  }

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

  // FLAG: the attribute label is a plain div not associated with its value, so the row is found by CSS
  attribute(label: string) {
    return this.root
      .locator('.field-row')
      .filter({ has: this.page.locator('.field-label', { hasText: new RegExp(`^${label}$`) }) })
      .locator('.field-value')
  }

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

  activity(text: string | RegExp) {
    return this.root.locator('.feed').getByRole('listitem').filter({ hasText: text })
  }

  checklistItem(commentText: string, item: string) {
    return this.comment(commentText)
      .getByRole('listitem')
      .filter({ hasText: item })
      .getByRole('checkbox')
  }

  // FLAG: the native checkbox and its `<label>` have no size, only the icon inside the label can be clicked
  async toggleChecklistItem(commentText: string, item: string) {
    await this.comment(commentText)
      .getByRole('listitem')
      .filter({ hasText: item })
      .locator('label .icon')
      .click()
  }

  // FLAG: the feed filters are icon-only buttons named by their ligature ("chat", "check_circle 1/2")
  get commentsFilter() {
    return this.root.locator('.feed').getByRole('button', { name: 'chat', exact: true })
  }

  get checklistsFilter() {
    return this.root.locator('.feed').getByRole('button', { name: /^check_circle \d+\/\d+$/ })
  }

  /**
   * Add an on/off filter from the feed's "Search and filter" dropdown, e.g. "Versions",
   * "Updates" or "Attachments", and wait for the feed to load with it. It applies as soon as it is
   * picked and shows as a chip.
   * Until the filtered activities arrive the feed shows the old entries or loading placeholders, so
   * the reload is the signal that absent entries are really filtered out (a filter combination
   * that was loaded before comes from the cache without a request; don't use this for it).
   * FLAG: the dropdown entries are plain list items ("<icon> <label>").
   */
  async addFeedFilter(label: string) {
    const feed = this.root.locator('.feed')
    await feed.getByRole('textbox', { name: 'Search and filter' }).click()
    const reloaded = this.page.waitForResponse(
      (res) =>
        new URL(res.url()).pathname === '/graphql' &&
        (res.request().postData() ?? '').includes('query GetActivities('),
    )
    await feed
      .getByRole('listitem')
      .filter({ has: this.page.getByText(label, { exact: true }) })
      .click()
    await reloaded
  }

  // ---------------------------------------------------------------------------
  // comment box: attachments and references
  // ---------------------------------------------------------------------------

  /**
   * The box for a new comment at the bottom of the feed (a comment being edited has its own).
   * FLAG: it has no role or name, so it is found as the `.comment-container` directly in the feed.
   */
  get newCommentBox() {
    return this.root.locator('.feed > .comment-container')
  }

  /** Expand the collapsed comment box and wait for its editor */
  async openCommentBox() {
    await this.root.getByText(/^(Leave a comment|Comment, or type)/).click()
    await expect(this.commentEditor).toBeVisible()
  }

  /** Post what is in the comment box; the button stays disabled while files upload */
  async submitComment() {
    await this.newCommentBox.getByRole('button', { name: 'Comment', exact: true }).click()
  }

  /**
   * Attach local files to the open comment box with its paperclip button.
   * FLAG: the button is icon-only, its accessible name is the icon ligature "attach_file".
   */
  async attachFiles(...paths: string[]) {
    const chooser = this.page.waitForEvent('filechooser')
    await this.newCommentBox.getByRole('button', { name: 'attach_file', exact: true }).click()
    await (await chooser).setFiles(paths)
  }

  /**
   * A file card (attachment) by file name, in a comment, in the comment box or in a comment being
   * edited. Its link downloads the file, "open_in_full" previews it and "close" removes it (boxes).
   * FLAG: the cards have no role or name; a card is the element around the footer with the name.
   */
  fileCard(scope: Locator, fileName: string) {
    return scope.locator('div:has(> footer .name-wrapper)').filter({ hasText: fileName })
  }

  /** an attachment shown under a posted comment */
  attachment(commentText: string, fileName: string) {
    return this.fileCard(this.comment(commentText), fileName)
  }

  /**
   * Type a mention trigger and a search into the open comment box (or the editor of a comment
   * being edited) and pick an option by its label: `@` users and teams, `@@` versions of the task,
   * `@@@` tasks of the same folder. Options read "<icon> <context> - <label> [<age>]", e.g.
   * "image renderMain - v001 Just now".
   */
  async mention(trigger: '@' | '@@' | '@@@', search: string, label: string, editor?: Locator) {
    await (editor ?? this.commentEditor).pressSequentially(`${trigger}${search}`)
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    await this.page
      .getByRole('listbox')
      .getByRole('option', { name: new RegExp(`(^| )${escaped}( |$)`) })
      .click()
  }

  /**
   * A reference to an entity (task, version, ...) or a user inside a comment, by its label.
   * Clicking an entity reference opens that entity in a slide-out panel (`DetailsPanel.slideOut`).
   * FLAG: references are spans without a role; they are found by their `reference` class.
   */
  reference(commentText: string, label: string) {
    return this.comment(commentText).locator('.reference').filter({ hasText: label })
  }

  /**
   * The panel that slides out over the details panel when a reference is clicked.
   * FLAG: it is a second `.details-panel` without a role, name or class of its own, rendered after
   * the main one.
   */
  static slideOut(page: Page) {
    return new DetailsPanel(page, page.locator('.details-panel').nth(1))
  }

  // ---------------------------------------------------------------------------
  // watchers
  // ---------------------------------------------------------------------------

  /**
   * The watchers dropdown (bell) in the panel toolbar. Its icon is "notifications_active" while the
   * signed-in user watches the entity and "notifications" otherwise.
   * FLAG: an icon-only button without a name, found by its tooltip.
   */
  get watchersButton() {
    return this.root.locator('button[data-tooltip="Watchers"]')
  }

  /** "Watch" or "Unwatch" the entity as the signed-in user, from the watchers dropdown */
  async setWatching(watch: boolean) {
    await this.watchersButton.click()
    // FLAG: both entries are plain divs without a role, found by their title
    await this.page.getByText(watch ? 'Watch' : 'Unwatch', { exact: true }).click()
    await expect(this.watchersButton).toHaveText(watch ? 'notifications_active' : 'notifications')
    await this.closeDropdown()
  }

  /** Toggle other users (by user name) in the watchers dropdown, then close it */
  async toggleWatchers(...userNames: string[]) {
    await this.watchersButton.click()
    for (const name of userNames) {
      await this.page.locator(`.options [data-value="${name}"]`).first().click()
    }
    await this.closeDropdown()
  }

  /**
   * Close an open header dropdown by clicking outside of it: Escape also reaches the overview table,
   * which clears its selection and with it closes the panel.
   */
  private async closeDropdown() {
    await this.root.getByRole('heading', { level: 2 }).click()
    await expect(this.page.locator('.options')).toBeHidden()
  }
}
