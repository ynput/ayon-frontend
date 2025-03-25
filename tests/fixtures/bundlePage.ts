import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

const getBundleName = (prefix: string, suffix?: string) => (browser: string) =>
  prefix + '_' + browser + `${suffix ? '_' + suffix : ''}`

const dialogTitle = 'Copy addon settings to your new {status} bundle?'

class BundlePage {
  constructor(public readonly page: Page, public readonly browserName: String) {}

  async goto() {
    await this.page.goto('/settings/bundles')
    // wait for the page to load
    await expect(this.page.getByRole('button', { name: 'Bundles' })).toBeVisible()
  }

  async createBundle(name: string) {
    await this.page.getByRole('button', { name: 'add Add Bundle' }).click()
    await this.page.getByLabel('Bundle name').fill(name)
    await this.page.getByRole('button', { name: 'Select an option...' }).click()
    const launcher = '1.1.1'
    await expect(this.page.getByTestId(`installer-option-${launcher}`)).toBeVisible()
    await (this.page.getByTestId(`installer-option-${launcher}`)).click()

    // check that bundle is compatible
    const compatibleMessage = 'Checks complete: Bundle is compatible'
    await expect(this.page.getByText(compatibleMessage)).toBeVisible()
    await this.page.getByRole('button', { name: 'check Create new bundle' }).click()
    await expect(this.page.getByRole('cell', { name })).toBeVisible()
  }

  async bundleContextClick(name: string, actionName: string) {
    // open context menu
    await this.page.getByRole('cell', { name }).click({ button: 'right' })
    // select item
    await this.page.getByRole('menuitem', { name: actionName }).click()
  }

  async copySettingsDialog(bundleStatus, confirm: boolean) {
    // check dialog is visible
    await expect(this.page.getByText(dialogTitle.replace('{status}', bundleStatus))).toBeVisible()
    // confirm dialog
    if (confirm) {
      await this.page.getByRole('button', { name: 'Copy all settings' }).click()
    } else {
      await this.page.getByRole('button', { name: 'Do not copy' }).click()
    }
    // check dialog is hidden
    await expect(this.page.getByText(dialogTitle.replace('{status}', bundleStatus))).toBeHidden()
    if (confirm) {
      // check for success toast
      await expect(this.page.getByText('Settings copied from')).toBeVisible()
    }
  }

  async setBundleStatus(name: string, status: 'production' | 'staging' | 'dev') {
    // set status using context menu
    await this.bundleContextClick(name, `add Set ${status}`)
    // check bundle has status tag
    await expect(this.page.getByTestId(`${name}-${status}`)).toBeVisible()
  }

  async unsetBundleStatus(name: string, status: 'production' | 'staging' | 'dev') {
    // unset status using context menu
    await this.bundleContextClick(name, `remove Unset ${status}`)
    // check bundle no longer has status tag
    await expect(this.page.getByTestId(`${name}-${status}`)).toBeHidden()
  }

  async deleteBundle(name: string) {
    // archive bundle using context menu
    await this.bundleContextClick(name, 'archive Archive')
    // delete bundle using context menu
    await this.bundleContextClick(`${name} (archived)`, 'delete Delete')
    // confirm deletion in dialog
    await this.page.getByLabel('Delete', { exact: true }).click()
    // check that bundle is no longer visible
    await expect(this.page.getByRole('cell', { name })).toBeHidden()
  }
}

const test = base.extend<{ bundlePage: BundlePage }>({
  bundlePage: async ({ page, browserName }, use) => {
    const projectPage = new BundlePage(page, browserName)
    await use(projectPage)
  },
})

export default BundlePage
export { getBundleName, test as bundleTest }
