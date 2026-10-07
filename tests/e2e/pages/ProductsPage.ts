import { expect, Locator, Page } from '@playwright/test'
import { menuItem } from '../support/ui'

export class ProductsPage {
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

  async setEnumCell(name: string, columnId: string, value: string) {
    await this.cell(name, columnId).dblclick()
    await this.page.locator(`.options [data-value="${value}"]`).first().click()
  }

  async openInViewer(name: string) {
    await this.cell(name, 'name').click({ button: 'right' })
    await menuItem(this.page, 'Open in viewer').click()
  }

  async openDetails(name: string) {
    await this.cell(name, 'name').dblclick()
  }
}
