import { expect, Page } from '@playwright/test'
import { AyonApi } from '../support/api'
import { confirmDialog, dialog, formRow, menuItem, toast } from '../support/ui'

/** /projects/:project/lists */
export class ListsPage {
  constructor(readonly page: Page) {}

  async goto(project: string) {
    await this.page.goto(`/projects/${project}/lists`)
    await expect(this.addListButton).toBeVisible({ timeout: 30_000 })
  }

  get addListButton() {
    return this.page.locator('button.add-list')
  }

  listRow(label: string) {
    return this.page.getByRole('row').filter({ hasText: label }).first()
  }

  async createList({ label, entityType }: { label: string; entityType?: string }) {
    await this.addListButton.click()
    await this.submitNewListDialog({ label, entityType })
  }

  /** Fill in and submit the open "Create New List" dialog */
  async submitNewListDialog({ label, entityType }: { label: string; entityType?: string }) {
    const newList = dialog(this.page, 'Create New List')
    await expect(newList).toBeVisible()
    await newList.getByLabel('List label').fill(label)
    if (entityType) {
      // FLAG: <label for="entityType"> points at nothing, the Dropdown has no matching id
      await newList.locator('label[for="entityType"] + *').getByRole('button').click()
      await this.page.locator(`.options [data-value="${entityType}"]`).click()
    }
    await newList.getByRole('button', { name: 'Create list' }).click()
    await expect(newList).toBeHidden()
  }

  async renameList(label: string, newLabel: string) {
    await this.listRow(label).click({ button: 'right' })
    await menuItem(this.page, 'Rename list').click()
    // the only input inside a table row is the rename input
    const input = this.page.getByRole('row').getByRole('textbox')
    await expect(input).toBeFocused()
    await input.fill(newLabel)
    await input.press('Enter')
    await expect(input).toBeHidden()
  }

  async openList(label: string) {
    await this.listRow(label).click()
    await expect(this.itemsTable).toBeVisible()
  }

  get itemsTable() {
    return this.page
      .getByRole('table')
      .filter({ has: this.page.getByRole('columnheader', { name: 'Thumbnail' }) })
  }

  itemNameCell(label: string) {
    return this.itemsTable.locator('td.name').filter({ hasText: label })
  }

  async removeItem(label: string) {
    const cell = this.itemNameCell(label)
    await cell.click()
    await cell.click({ button: 'right' })
    await menuItem(this.page, 'Remove from list').click()
    await confirmDialog(this.page).getByRole('button', { name: 'Remove' }).click()
    await expect(toast(this.page, 'Deleted 1 item from list')).toBeVisible()
  }

  async openDetails(label: string) {
    await this.listRow(label).dblclick()
    await expect(this.page.getByRole('heading', { name: label, level: 2 })).toBeVisible()
  }

  detail(name: string) {
    return this.page.getByText(name, { exact: true }).locator('xpath=following-sibling::*[1]')
  }

  async deleteList(label: string) {
    await this.listRow(label).click({ button: 'right' })
    await menuItem(this.page, 'Delete').click()
    await confirmDialog(this.page).getByRole('button', { name: 'Delete' }).click()
    await expect(toast(this.page, `list "${label}" deleted`)).toBeVisible()
  }

  // ---------------------------------------------------------------------------
  // lists panel: selection, header menu, search
  // ---------------------------------------------------------------------------

  /** Click a list (or folder) row; with `add` ctrl/cmd + click adds it to the selection */
  async selectListRow(label: string, { add = false } = {}) {
    await this.listRow(label).click({ modifiers: add ? ['ControlOrMeta'] : [] })
    // FLAG: SimpleTable rows have no aria-selected; being selected is a class of the cell content
    await expect(this.listRow(label).locator('.selected')).toBeVisible()
  }

  /** Right-click a list or folder row and pick an item of its context menu */
  async rowMenu(label: string, item: string) {
    await this.listRow(label).click({ button: 'right' })
    await menuItem(this.page, item).click()
  }

  /** Pick an item of the "..." menu in the header of the lists panel, e.g. "Show archived" */
  async headerMenu(item: string) {
    // FLAG: the header buttons are icon-only, and the top nav has a second "more_horiz" button
    await this.page.locator('button.list-menu').click()
    await menuItem(this.page, item).click()
  }

  /** Filter the lists panel by label with its search button */
  async search(text: string) {
    // FLAG: icon-only button ("search"); the items toolbar has a "Search and filter" box as well
    await this.page.locator('button.search-lists').click()
    await this.page.getByPlaceholder('Search', { exact: true }).fill(text)
  }

  // ---------------------------------------------------------------------------
  // list folders (powerpack)
  // ---------------------------------------------------------------------------

  /** The open "Create Folder ..." or "Edit Folder ..." dialog */
  folderDialog(header: string | RegExp = /^(Create|Edit) Folder/) {
    return dialog(this.page, header)
  }

  /** Fill in the label and submit the open folder dialog */
  async submitFolderDialog(label: string, header?: string | RegExp) {
    const folderDialog = this.folderDialog(header)
    await expect(folderDialog).toBeVisible()
    // FLAG: the dialog's "Label" is not associated with its input
    await folderDialog.getByPlaceholder('Enter folder label').fill(label)
    await folderDialog.getByRole('button', { name: /(Create|Save) folder$/ }).click()
    await expect(folderDialog).toBeHidden()
  }

  /** The expand/collapse chevron of a folder row */
  folderExpander(label: string) {
    // FLAG: icon-only button, its name is the icon ligature
    return this.listRow(label).getByRole('button', { name: /^(chevron_right|expand_more)$/ })
  }

  async setFolderExpanded(label: string, expanded: boolean) {
    const expander = this.folderExpander(label)
    const icon = expanded ? 'expand_more' : 'chevron_right'
    if ((await expander.textContent())?.trim() !== icon) await expander.click()
    await expect(expander).toHaveText(icon)
  }

  /** "Move list" / "Move folder" dialog: pick the target folder and move */
  async moveTo(folderLabel: string) {
    const moveDialog = dialog(this.page, /^Move (list|folder|\d+ lists|\d+ folders)/)
    await expect(moveDialog).toBeVisible()
    await moveDialog.getByRole('row').filter({ hasText: folderLabel }).click()
    await moveDialog.getByRole('button', { name: 'Move', exact: true }).click()
    await expect(moveDialog).toBeHidden()
  }

  // ---------------------------------------------------------------------------
  // list details panel
  // ---------------------------------------------------------------------------

  /** Switch the open details panel to its "Details" or "Share" tab */
  async detailsTab(tab: 'Details' | 'Share') {
    // FLAG: icon ligatures are part of the tab buttons' names
    const icons = { Details: 'lists', Share: 'share' }
    await this.page.getByRole('button', { name: `${icons[tab]} ${tab}`, exact: true }).click()
  }

  /**
   * A row of "People with access" in the Share tab by its label: "Everyone" or a user's full name.
   * FLAG: the share form (a powerpack module) has no roles, rows are found by their label element.
   */
  accessRow(label: string) {
    return this.page.locator('.title-label', { hasText: label }).locator('xpath=..')
  }

  /** Change an access level in the Share tab (not saved until `saveAccess`) */
  async setAccessLevel(label: string, level: 'No access' | 'Viewer' | 'Editor' | 'Admin') {
    await this.accessRow(label)
      .getByRole('button', { name: /No access|Viewer|Editor|Admin/ })
      .click()
    await this.page.locator('.options').getByText(level, { exact: true }).click()
    await expect(this.accessRow(label)).toContainText(level)
  }

  /** Add a user to "People with access" in the Share tab; they start as "Viewer" */
  async addAccess(search: string, label: string) {
    const input = this.page.getByPlaceholder('Add people or access groups')
    await input.fill(search)
    await input.press('Enter')
    await expect(this.accessRow(label)).toContainText('Viewer')
  }

  async saveAccess() {
    const save = this.page.getByRole('button', { name: /Save access$/ })
    await save.click()
    // the button is only enabled while there are unsaved changes
    await expect(save).toBeDisabled()
  }

  // ---------------------------------------------------------------------------
  // list items
  // ---------------------------------------------------------------------------

  /** Name cells of the items of the open list from top to bottom */
  itemNameCells() {
    return this.itemsTable.locator('tbody td.name')
  }

  /** The row of an item of the open list by its name */
  itemRow(label: string) {
    return this.itemsTable
      .getByRole('row')
      .filter({ has: this.page.locator('td.name', { hasText: label }) })
  }

  itemCell(label: string, columnId: string) {
    return this.itemRow(label).locator(`td.${columnId}`)
  }

  /**
   * Drag an item by its handle onto the row of another item.
   * The handle only shows while its row is hovered, and dnd-kit only starts dragging after the
   * pointer moved 5px, so the drag waits for both before moving onto the target.
   */
  async dragItem(label: string, ontoLabel: string) {
    const handle = this.itemRow(label).getByTitle('Drag to reorder')
    // the handle fades in (visibility transition); a press before that lands on the cell instead
    await this.itemNameCell(label).hover()
    await expect(handle).toBeVisible()
    await handle.hover()
    const from = await handle.boundingBox()
    const to = await this.itemRow(ontoLabel).boundingBox()
    if (!from || !to) throw new Error('item rows are not visible')
    const x = from.x + from.width / 2
    const y = from.y + from.height / 2
    const direction = to.y < from.y ? -1 : 1
    await this.page.mouse.down()
    await this.page.mouse.move(x, y + 10 * direction, { steps: 5 })
    // while dragging, the row itself is hidden and a copy follows the pointer
    await expect(this.itemRow(label)).toBeHidden()
    await this.page.mouse.move(x, to.y + to.height / 2, { steps: 10 })
    // the target row makes room for the dragged one once the drop position is known
    await expect.poll(async () => (await this.itemRow(ontoLabel).boundingBox())?.y).not.toBe(to.y)
    await this.page.mouse.up()
  }

  /**
   * Click an item cell to select it; with `shift` the selection extends from the last clicked cell,
   * like in the overview.
   */
  async clickItemCell(label: string, columnId: string, { shift = false } = {}) {
    const cell = this.itemCell(label, columnId)
    // click the left edge: the chevron on the right of enum cells opens their dropdown straight away
    await cell.click({ position: { x: 4, y: 4 }, modifiers: shift ? ['Shift'] : [] })
    await expect(cell).toHaveClass(/selected/)
  }

  /** Enter edits the focused cell; picking a value applies it to every selected cell of the column */
  async pickForSelectedCells(value: string) {
    await this.page.keyboard.press('Enter')
    await this.page.locator(`.options [data-value="${value}"]`).first().click()
  }

  /** The delete button in the items toolbar, enabled while items the user may remove are selected */
  get removeItemsButton() {
    // FLAG: icon-only button ("remove")
    return this.page.getByRole('button', { name: 'remove', exact: true })
  }

  /** Type a new value into a text cell of an item; Escape leaves the editor that Enter opens below */
  async editItemTextCell(label: string, columnId: string, value: string) {
    const cell = this.itemCell(label, columnId)
    await cell.dblclick()
    const input = cell.locator('input')
    await expect(input).toBeFocused()
    await input.fill(value)
    await input.press('Enter')
    await expect(input).toBeHidden()
    await this.page.keyboard.press('Escape')
    await expect(this.itemsTable.locator('td.editing')).toHaveCount(0)
  }

  /**
   * Show a column from the "+" (add column) menu at the end of the items header. Attributes,
   * including the list's own, are in the "<Entity> attributes" submenu, pass it as `submenu`.
   */
  async showItemColumn(label: string, submenu?: string) {
    // FLAG: icon-only button, and the lists panel has a second "add" button
    await this.page.locator('[data-tooltip="Add column"]').click()
    if (submenu) await menuItem(this.page, submenu).hover()
    await menuItem(this.page, label).click()
    // items toggle without closing the menu; the first Escape closes the submenu, the second the menu
    if (submenu) await this.page.keyboard.press('Escape')
    await this.page.keyboard.press('Escape')
    await expect(menuItem(this.page, label)).toBeHidden()
  }

  // ---------------------------------------------------------------------------
  // list attributes (custom fields of one list's items, a powerpack feature)
  // ---------------------------------------------------------------------------

  /** Create a text attribute for the open list in Customize > List attributes */
  async createListAttribute(title: string) {
    await this.page.getByRole('button', { name: 'settings Customize', exact: true }).click()
    await this.page.getByText('List attributes', { exact: true }).click()
    await this.page.getByRole('button', { name: 'add Add attribute', exact: true }).click()
    // the editor's header follows the title as it is typed, so find it by its submit button
    const create = this.page.getByRole('button', { name: /Create Attribute$/ })
    const editor = this.page.locator('.dialog').filter({ has: create })
    await expect(editor).toBeVisible()
    await formRow(editor, 'Title').getByRole('textbox').fill(title)
    await create.click()
    await expect(editor).toBeHidden()
  }

  /**
   * A field of the list details panel ("Details" tab) by its label, e.g. "Active".
   * FLAG: the label is a plain div that is not associated with the value, so the row is found by CSS.
   */
  listField(label: string) {
    return this.page
      .locator('.field-row')
      .filter({ has: this.page.locator('.field-label', { hasText: new RegExp(`^${label}$`) }) })
      .locator('.field-value')
  }
}

/** True if the server runs the powerpack addon (list folders, sharing and list attributes) */
export const hasPowerpack = async (api: AyonApi) => {
  const { addons } = await api.get('/api/addons')
  return addons.some((a: any) => a.name === 'powerpack' && a.productionVersion)
}

/** True if the server runs the review addon (review sessions) */
export const hasReviewAddon = async (api: AyonApi) => {
  const { addons } = await api.get('/api/addons')
  return addons.some((a: any) => a.name === 'review' && a.productionVersion)
}

/** The "Add to list" dialog opened from any entity context menu */
export const addToList = async (page: Page, listLabel: string) => {
  const addDialog = dialog(page, 'Add to list')
  await expect(addDialog).toBeVisible()
  await addDialog.getByRole('row').filter({ hasText: listLabel }).click()
  await addDialog.getByRole('button', { name: 'Add to list' }).click()
  await expect(addDialog).toBeHidden()
}
