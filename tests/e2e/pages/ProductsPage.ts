import { expect, Locator, Page } from '@playwright/test'

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
}
