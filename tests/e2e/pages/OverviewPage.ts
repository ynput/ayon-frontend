import { expect, Locator, Page } from '@playwright/test'
import { dialog, menuItem, toast } from '../support/ui'
import { DetailsPanel } from './DetailsPanel'

/**
 * /projects/:project/overview — the folder/task tree table.
 * Edits are saved immediately (optimistic updates); there is no explicit save step.
 */
export class OverviewPage {
  /** the main tree table (the hierarchy slicer on the left is a separate table) */
  readonly table: Locator

  constructor(readonly page: Page) {
    this.table = page
      .getByRole('table')
      .filter({ has: page.getByRole('columnheader', { name: 'Folder / Task' }) })
  }

  async goto(project: string) {
    await this.page.goto(`/projects/${project}/overview`)
    // project pages load addons and remote modules first, the first load on a cold dev server is slow
    await expect(this.table).toBeVisible({ timeout: 30_000 })
  }

  row(label: string) {
    return this.table
      .getByRole('row')
      .filter({ has: this.page.locator('td.name', { hasText: label }) })
  }

  nameCell(label: string) {
    return this.row(label).locator('td.name')
  }

  cell(label: string, columnId: string) {
    return this.row(label).locator(`td.${columnId}`)
  }

  async selectRow(label: string) {
    await this.nameCell(label).click()
    await expect(this.nameCell(label)).toHaveClass(/selected/)
  }

  /** Double-clicking a name opens the details panel */
  async openDetails(label: string) {
    await this.nameCell(label).dblclick()
    const panel = new DetailsPanel(this.page)
    await panel.expectOpenFor(label)
    return panel
  }

  async expand(label: string) {
    const expander = this.nameCell(label).locator('.expander')
    if ((await expander.textContent())?.includes('chevron_right')) await expander.click()
  }

  // ---------------------------------------------------------------------------
  // creating
  // ---------------------------------------------------------------------------

  async openCreate(type: 'folder' | 'sequence' | 'task') {
    await this.page.getByRole('button', { name: 'add Create', exact: true }).click()
    await this.page.locator(`.option[data-value="${type}"]`).click()
  }

  createDialog() {
    return dialog(this.page, /^Add New/)
  }

  /**
   * Create a folder through the "Create" menu. Selected folders become the parent,
   * so select one first to create a child folder.
   */
  async createFolder({ label, type }: { label: string; type?: string }) {
    await this.openCreate('folder')
    await this.fillCreateDialog(label, type)
    await this.createDialog().getByRole('button', { name: 'Create folder' }).click()
    await expect(this.createDialog()).toBeHidden()
  }

  /** Create a task in the selected folder(s) */
  async createTask({ label, type }: { label: string; type?: string }) {
    await this.openCreate('task')
    await this.fillCreateDialog(label, type)
    await this.createDialog().getByRole('button', { name: 'Create task' }).click()
    await expect(this.createDialog()).toBeHidden()
  }

  private async fillCreateDialog(label: string, type?: string) {
    const createDialog = this.createDialog()
    await expect(createDialog).toBeVisible()
    if (type) await this.pickCreateDialogType(type)
    await createDialog.getByLabel('Label', { exact: true }).fill(label)
  }

  private async pickCreateDialogType(type: string) {
    // the dialog opens the type dropdown by itself shortly after it appears (NewEntity handleShow)
    const option = this.page.locator(`.options [data-value="${type}"]`)
    await option.waitFor({ timeout: 2_000 }).catch(async () => {
      await this.createDialog().locator('label:text-is("Type") + *').getByRole('button').click()
    })
    await option.click()
  }

  /**
   * Create numbered folders in one go with "Folder sequence", e.g. sh010, sh020, sh030 from
   * `first: 'sh010'` and `count: 3`. Selected folders become the parent.
   * FLAG: the sequence form's labels ("First Name", "Count", ...) are not associated with their
   * inputs, so the inputs are found by id.
   */
  async createFolderSequence({
    type,
    first,
    count,
  }: {
    type: string
    first: string
    count: number
  }) {
    await this.openCreate('sequence')
    const createDialog = this.createDialog()
    await expect(createDialog).toBeVisible()
    await this.pickCreateDialogType(type)
    // the second name (the increment) follows from the first name and the folder type
    await createDialog.locator('input#base').fill(first)
    await createDialog.locator('input#length').fill(String(count))
    await createDialog.getByRole('button', { name: 'Create folder' }).click()
    await expect(createDialog).toBeHidden()
  }

  // ---------------------------------------------------------------------------
  // editing
  // ---------------------------------------------------------------------------

  /** Rename with the "r" shortcut on the selected name cell */
  async rename(label: string, newLabel: string) {
    await this.selectRow(label)
    await this.page.keyboard.press('r')
    const input = this.page.getByPlaceholder(/(Folder|Task) label\.\.\./)
    await expect(input).toBeVisible()
    await input.fill(newLabel)
    await input.press('Enter')
    await expect(input).toBeHidden()
  }

  /** Pick a value in an enum cell (status, type, priority, ...) */
  async setEnumCell(label: string, columnId: string, value: string) {
    const cell = this.cell(label, columnId)
    await cell.dblclick()
    await this.page.locator(`.options [data-value="${value}"]`).first().click()
  }

  async deleteRow(label: string) {
    await this.selectRow(label)
    await this.nameCell(label).click({ button: 'right' })
    await menuItem(this.page, 'Delete').click()
    await confirmDeleteEntities(this.page, label)
  }

  /**
   * Click a cell to select it. With `shift` the selection extends from the last clicked cell,
   * like in a spreadsheet.
   */
  async clickCell(label: string, columnId: string, { shift = false } = {}) {
    // click the left edge: the chevron on the right of enum cells opens their dropdown straight away
    await this.cell(label, columnId).click({
      position: { x: 4, y: 4 },
      modifiers: shift ? ['Shift'] : [],
    })
    await expect(this.cell(label, columnId)).toHaveClass(/selected/)
  }

  /**
   * Enter edits the focused cell. Picking a value in an enum cell applies it to every selected cell
   * of that column.
   */
  async pickForSelectedCells(value: string) {
    await this.page.keyboard.press('Enter')
    await this.page.locator(`.options [data-value="${value}"]`).first().click()
  }

  /** Type a new value into a text or number cell */
  async editTextCell(label: string, columnId: string, value: string) {
    const cell = this.cell(label, columnId)
    await cell.dblclick()
    const input = cell.locator('input')
    await expect(input).toBeFocused()
    await input.fill(value)
    // Enter saves and, spreadsheet style, starts editing the same column in the next row;
    // Escape leaves that editor without changing anything
    await input.press('Enter')
    await expect(input).toBeHidden()
    await this.page.keyboard.press('Escape')
    await expect(this.table.locator('td.editing')).toHaveCount(0)
  }

  // ---------------------------------------------------------------------------
  // history
  // ---------------------------------------------------------------------------

  async undo() {
    await this.page.getByRole('button', { name: 'undo', exact: true }).click()
  }

  async redo() {
    await this.page.getByRole('button', { name: 'redo', exact: true }).click()
  }

  // ---------------------------------------------------------------------------
  // view: columns and grouping (stored per user and project, see tests/AGENTS.md)
  // ---------------------------------------------------------------------------

  /**
   * A column header by column id (the same ids as `cell()`, e.g. `status`, `attrib_fps`).
   * FLAG: the header's accessible name changes on hover, when its "more_horiz" and "sort" icon
   * buttons appear, so headers are found by their `data-column-id`.
   */
  columnHeader(columnId: string) {
    return this.table.locator(`th[data-column-id="${columnId}"]`)
  }

  /** Ids of the shown columns from left to right */
  async columnIds() {
    const ids = await this.table
      .locator('th[data-column-id]')
      .evaluateAll((ths) => ths.map((th) => th.getAttribute('data-column-id')))
    return ids.filter((id) => id !== '__row_selection__')
  }

  /** Open the "..." menu of a column header and pick an item, e.g. "Hide column" */
  async columnMenu(columnId: string, item: string) {
    const header = this.columnHeader(columnId)
    // the menu button only shows while the header is hovered
    await header.hover()
    await header.getByRole('button', { name: 'more_horiz', exact: true }).click()
    await menuItem(this.page, item).click()
  }

  /**
   * Show a hidden column from the "+" (add column) menu at the end of the header.
   * Attribute columns are in the "Attributes" submenu, pass it as `submenu`.
   */
  async showColumn(label: string, submenu?: string) {
    await this.page.getByRole('button', { name: 'add', exact: true }).click()
    if (submenu) await menuItem(this.page, submenu).hover()
    await menuItem(this.page, label).click()
    // items toggle without closing the menu; the first Escape closes the submenu, the second the menu
    if (submenu) await this.page.keyboard.press('Escape')
    await this.page.keyboard.press('Escape')
    await expect(menuItem(this.page, label)).toBeHidden()
  }

  /** Group the rows by a field from the "Group by" dropdown in the toolbar */
  async groupBy(label: string) {
    await this.page.getByRole('button', { name: /^Group by/ }).click()
    await this.page.locator('.options').getByText(label, { exact: true }).click()
  }

  /** The header row of a group (group by mode), e.g. a status */
  groupRow(label: string) {
    return this.table
      .getByRole('row')
      .filter({ has: this.page.locator('td.name', { hasText: label }) })
      .and(this.table.locator('tr.group-row'))
  }
}

/** The "Delete forever" dialog shared by every page that deletes folders/tasks/products */
export const confirmDeleteEntities = async (page: Page, label: string) => {
  const confirm = dialog(page, /^Delete forever/)
  await expect(confirm).toBeVisible()
  await confirm.getByTestId('delete-confirm-name-input').fill(label)
  await confirm.getByTestId('delete-confirm-submit').click()
  await expect(confirm).toBeHidden()
  await expect(toast(page, /deleted/)).toBeVisible()
}
