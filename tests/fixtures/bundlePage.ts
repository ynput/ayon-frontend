import {expect, test as base } from '@playwright/test'
import type {Page } from '@playwright/test'

const getBundleName = prefix => browser => prefix + '_' + browser

class BundlePage {
  constructor(
    public readonly page: Page,
    public readonly browserName: String,
  ) {}

  async goto() {
    await this.page.goto('/settings/bundles')
  }

  async createBundle(name: string) {
    await this.goto()
    await this.page.goto('/settings/bundles')
    await this.page.getByRole('button', { name: 'add Add Bundle' }).click()
    await this.page.getByRole('main').getByRole('textbox').fill(name)
    await this.page.getByRole('button', { name: 'Select an option...' }).click()
    const launcher = '1.0.2'
    await this.page.getByText(launcher).click()
    await this.page.getByRole('button', { name: 'check Create new bundle' }).click()
    await expect(this.page.getByText('Bundle created')).toBeVisible()
    await expect(this.page.getByRole('cell', { name })).toBeVisible()

  }

  async deleteBundle(name) {
    await this.goto()
    await this.page.getByRole('cell', { name}).click({ button: 'right' })
    await this.page.getByRole('menuitem', { name: 'archive Archive' }).click()
    await this.page.getByRole('cell', { name: `${name} (archived)` }).click({ button: 'right' })
    await this.page.getByRole('menuitem', { name: 'delete Delete' }).click()
    await this.page.getByLabel('Delete', { exact: true }).click()
    await expect(this.page.getByText('bundles deleted')).toBeVisible()
    await expect(this.page.getByRole('cell', { name })).toBeHidden()
  }
}

const test = base.extend<{ bundlePage: BundlePage }>({
  bundlePage: async ({ page, browserName }, use) => {
    const projectPage = new BundlePage(page, browserName);
    await use(projectPage);
  },
});

export default BundlePage
export { getBundleName, test as bundleTest }