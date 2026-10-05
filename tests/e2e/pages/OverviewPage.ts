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
    if (type) {
      // the dialog opens the type dropdown by itself shortly after it appears (NewEntity handleShow)
      const option = this.page.locator(`.options [data-value="${type}"]`)
      await option.waitFor({ timeout: 2_000 }).catch(async () => {
        await createDialog.locator('label:text-is("Type") + *').getByRole('button').click()
      })
      await option.click()
    }
    await createDialog.getByLabel('Label', { exact: true }).fill(label)
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
