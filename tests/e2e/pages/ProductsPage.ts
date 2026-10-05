import { expect, Locator, Page } from '@playwright/test'
import { menuItem } from '../support/ui'

/**
 * /projects/:project/products — versions and products in one table.
 * The default view of a new project lists one row per version, named "<product> - v001".
 */
export class ProductsPage {
  /** the versions table (the hierarchy slicer on the left is a separate table) */
  readonly table: Locator

  constructor(readonly page: Page) {
    this.table = page
      .getByRole('table')
      .filter({ has: page.getByRole('columnheader', { name: 'Version / Product' }) })
  }

  async goto(project: string) {
    await this.page.goto(`/projects/${project}/products`)
    await expect(this.table).toBeVisible({ timeout: 30_000 })
  }

  row(name: string): Locator {
    return this.table.getByRole('row').filter({ hasText: name })
  }

  cell(name: string, columnId: string): Locator {
    return this.row(name).locator(`td.${columnId}`)
  }

  /** Pick a value in an enum cell (status, ...); like the overview, edits save immediately */
  async setEnumCell(name: string, columnId: string, value: string) {
    await this.cell(name, columnId).dblclick()
    await this.page.locator(`.options [data-value="${value}"]`).first().click()
  }

  /**
   * Right click a version row and pick "Open in viewer". The item is only offered on the
   * "Version / Product" cell (`name` column) of a single row.
   */
  async openInViewer(name: string) {
    await this.cell(name, 'name').click({ button: 'right' })
    await menuItem(this.page, 'Open in viewer').click()
  }

  /** Double click a row's name to open its details panel */
  async openDetails(name: string) {
    await this.cell(name, 'name').dblclick()
  }
}
