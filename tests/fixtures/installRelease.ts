import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

class InstallRelease {
  constructor(public readonly page: Page) {}

  async goto() {
    await this.page.goto('/dashboard/tasks')
  }

  async openMenu() {
    await this.page.getByRole('button', { name: 'apps' }).click()
    await this.page.getByText('Update Pipeline').click()
    await expect(this.page.getByText('Install pipeline release')).toBeVisible()
  }
  async changeAddons() {
    // click change button
    await this.page.getByRole('button', { name: 'Change' }).first().click()
    // check if dialog changes to addons select
    await expect(
      this.page.getByRole('button', { name: 'check_circle After Effects' }),
    ).toBeVisible()
    // select/deselect some addons
    await this.page.getByRole('button', { name: 'circle Clockify' }).click()
    await this.page.getByRole('button', { name: 'circle Fusion' }).click()
    await this.page.getByRole('button', { name: 'circle Houdini' }).click()
    await this.page.getByRole('button', { name: 'circle Maya' }).click()
    // confirm changes
    await this.page.getByRole('button', { name: 'Confirm' }).click()
    // check if dialog changes back to install pipeline release
    await expect(this.page.getByText('Install pipeline release')).toBeVisible()
  }

  async changePlatforms() {
    // click change button
    await this.page.getByRole('button', { name: 'Change' }).nth(1).click()
    // check if dialog changes to platforms select
    await expect(this.page.getByText('Select launcher platforms')).toBeVisible()
    // confirm changes
    await this.page.getByRole('button', { name: 'Confirm' }).click()
    // check if dialog changes back to install pipeline release
    await expect(this.page.getByText('Install pipeline release')).toBeVisible()
  }

  async install() {
    // click install button
    await this.page.getByRole('button', { name: 'check Confirm' }).click()
    // check we are on the progress page
    await expect(this.page.getByText('Installing')).toBeVisible()
    // check for success message (this could take a while)
    await expect(this.page.getByText('Installed successfully.')).toBeVisible({ timeout: 80000 })
    // close dialog
    await this.page.getByRole('button', { name: 'snooze Restart later (snooze)' }).click()

    // Unsetting production on the created bundle to prevent bundle specs failures
    const prodButton = this.page.getByRole('cell', { name: 'Production' }).locator('div')
    if (await prodButton.isVisible()) {
      await prodButton.click({ button: 'right' })
      await this.page.getByRole('menuitem', { name: 'remove Unset production Shift' }).click()
    }
    // check dialog is closed
    await expect(this.page.getByText('Install pipeline release')).not.toBeVisible()
  }
}

const test = base.extend<{ installRelease: InstallRelease }>({
  installRelease: async ({ page }, use) => {
    const installRelease = new InstallRelease(page)
    await use(installRelease)
  },
})

export default InstallRelease
export { test as installReleaseTest }
