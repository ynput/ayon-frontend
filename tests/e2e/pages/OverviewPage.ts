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

  // FLAG: the folder sequence form's labels are not associated with their inputs, so inputs are found by id
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

  async clickCell(label: string, columnId: string, { shift = false } = {}) {
    // click the left edge: the chevron on the right of enum cells opens their dropdown straight away
    await this.cell(label, columnId).click({
      position: { x: 4, y: 4 },
      modifiers: shift ? ['Shift'] : [],
    })
    await expect(this.cell(label, columnId)).toHaveClass(/selected/)
  }

  async pickForSelectedCells(value: string) {
    await this.page.keyboard.press('Enter')
    await this.page.locator(`.options [data-value="${value}"]`).first().click()
  }

  async editTextCell(label: string, columnId: string, value: string) {
    const cell = this.cell(label, columnId)
    await cell.dblclick()
    const input = cell.locator('input')
    await expect(input).toBeFocused()
    await input.fill(value)
    // Enter saves and starts editing the same column in the next row; Escape leaves that editor unchanged
    await input.press('Enter')
    await expect(input).toBeHidden()
    await this.page.keyboard.press('Escape')
    await expect(this.table.locator('td.editing')).toHaveCount(0)
  }

  // FLAG: the native date picker takes Enter while open, so the date is committed by clicking another cell
  async setDateCell(label: string, columnId: string, date: string) {
    const cell = this.cell(label, columnId)
    await cell.dblclick()
    const input = cell.locator('input[type="date"]')
    await expect(input).toBeFocused()
    await input.fill(date)
    await this.nameCell(label).click()
    await expect(input).toBeHidden()
  }

  async undo() {
    await this.page.getByRole('button', { name: 'undo', exact: true }).click()
  }

  async redo() {
    await this.page.getByRole('button', { name: 'redo', exact: true }).click()
  }

  // FLAG: header names change on hover (their icon buttons appear), so headers are found by data-column-id
  columnHeader(columnId: string) {
    return this.table.locator(`th[data-column-id="${columnId}"]`)
  }

  async columnIds() {
    const ids = await this.table
      .locator('th[data-column-id]')
      .evaluateAll((ths) => ths.map((th) => th.getAttribute('data-column-id')))
    return ids.filter((id) => id !== '__row_selection__')
  }

  async columnMenu(columnId: string, item: string) {
    const header = this.columnHeader(columnId)
    await header.hover()
    await header.getByRole('button', { name: 'more_horiz', exact: true }).click()
    await menuItem(this.page, item).click()
  }

  async showColumn(label: string, submenu?: string) {
    await this.page.getByRole('button', { name: 'add', exact: true }).click()
    if (submenu) await menuItem(this.page, submenu).hover()
    await menuItem(this.page, label).click()
    // items toggle without closing the menu; the first Escape closes the submenu, the second the menu
    if (submenu) await this.page.keyboard.press('Escape')
    await this.page.keyboard.press('Escape')
    await expect(menuItem(this.page, label)).toBeHidden()
  }

  async groupBy(label: string) {
    await this.page.getByRole('button', { name: /^Group by/ }).click()
    await this.page.locator('.options').getByText(label, { exact: true }).click()
  }

  groupRow(label: string) {
    return this.table
      .getByRole('row')
      .filter({ has: this.page.locator('td.name', { hasText: label }) })
      .and(this.table.locator('tr.group-row'))
  }

  // FLAG: the sort button is icon-only and only shows while the header is hovered
  async toggleSort(columnId: string) {
    const header = this.columnHeader(columnId)
    await header.hover()
    await header.getByRole('button', { name: 'sort', exact: true }).click()
  }

  nameCells() {
    return this.table.locator('tbody td.name')
  }

  async rowMenu(label: string, item: string) {
    await this.nameCell(label).click({ button: 'right' })
    await menuItem(this.page, item).click()
  }

  async submitCreateDialog(
    kind: 'folder' | 'task',
    { label, type }: { label: string; type?: string },
  ) {
    await this.fillCreateDialog(label, type)
    await this.createDialog()
      .getByRole('button', { name: `Create ${kind}` })
      .click()
    await expect(this.createDialog()).toBeHidden()
  }

  moveDialog() {
    return dialog(this.page, /^Select Folder/)
  }

  async moveTo(folderLabel: string) {
    const picker = this.moveDialog()
    await expect(picker).toBeVisible()
    await picker.getByText(folderLabel, { exact: true }).click()
    await picker.getByRole('button', { name: 'Select folder', exact: true }).click()
    await expect(picker).toBeHidden()
  }

  async addRowToSelection(label: string) {
    await this.nameCell(label).click({ modifiers: ['ControlOrMeta'] })
    await expect(this.nameCell(label)).toHaveClass(/selected/)
  }

  async deleteSelected() {
    await this.page.getByRole('button', { name: 'delete', exact: true }).click()
  }

  searchFilter() {
    return this.page.locator('.search-filter')
  }

  // FLAG: the "Search and filter" dropdown is a plain list without menu roles, so items are found by label
  async addFilter(scope: 'Task' | 'Folder', field: string, value: string) {
    // the "Search and filter" placeholder is gone once a filter is applied
    await this.searchFilter().getByRole('textbox').click()
    for (const label of [scope, field, value]) {
      await this.searchFilter()
        .getByRole('listitem')
        .filter({ has: this.page.getByText(label, { exact: true }) })
        .first()
        .click()
    }
  }

  // FLAG: filter chips have no role or accessible name, so they are found by their CSS class
  filterChip(label: string) {
    return this.searchFilter()
      .locator('.search-filter-item')
      .filter({ hasText: `${label}:` })
  }

  async removeFilter(label: string) {
    await this.filterChip(label).getByRole('button', { name: 'close', exact: true }).click()
    await expect(this.filterChip(label)).toBeHidden()
  }

  sidebar() {
    return this.page.getByRole('table').first()
  }

  async toggleSidebarFolder(label: string) {
    await this.sidebar().getByText(label, { exact: true }).click()
  }

  importDialog() {
    return dialog(this.page, /^Import folders and tasks/)
  }

  // FLAG: the CSV file input is hidden behind the "Choose .csv file" button, so it is set directly
  async importCsv(filePath: string, { created }: { created: number }) {
    await this.page.getByRole('button', { name: 'Import CSV' }).click()
    const wizard = this.importDialog()
    await expect(wizard).toBeVisible()
    await wizard.locator('input[type="file"]').setInputFiles(filePath)
    await expect(wizard.getByText(/\d+ rows found/)).toBeVisible()
    await wizard.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(wizard.getByRole('columnheader', { name: 'File column' })).toBeVisible()
    await wizard.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(wizard.getByRole('columnheader', { name: 'Mapped Value' })).toBeVisible()
    await wizard.getByRole('button', { name: 'Continue', exact: true }).click()
    await expect(wizard.getByText(`Creating: ${created}`)).toBeVisible()
    await wizard.getByRole('button', { name: 'Import data', exact: true }).click()
    await expect(wizard.getByText('Import finished')).toBeVisible({ timeout: 30_000 })
    await expect(wizard.getByText(`Created: ${created}`)).toBeVisible()
    await wizard.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(wizard).toBeHidden()
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

export const confirmDeleteCounts = async (
  page: Page,
  header: string | RegExp,
  counts: Partial<Record<'folder' | 'task' | 'product' | 'version', number>>,
) => {
  const confirm = dialog(page, header)
  await expect(confirm).toBeVisible()
  for (const [type, count] of Object.entries(counts)) {
    await confirm.getByTestId(`delete-confirm-count-${type}`).fill(String(count))
  }
  await confirm.getByTestId('delete-confirm-submit').click()
  await expect(confirm).toBeHidden()
}
