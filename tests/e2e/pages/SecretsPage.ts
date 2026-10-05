import { expect, Page } from '@playwright/test'
import { confirmDialog, toast } from '../support/ui'

/**
 * /settings/secrets — studio wide secrets. Only touch secrets the test created (`uniqueName`).
 * FLAG: a secret is a bare row of inputs without a label or accessible grouping, so rows are found
 * by the value of their (read-only) name input, and the icon buttons are named by their ligature.
 */
export class SecretsPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto('/settings/secrets')
    await expect(this.page.getByRole('heading', { name: 'Stored secrets' })).toBeVisible()
  }

  /** The whole list: the "New secret" heading and row, then "Stored secrets" and their rows */
  get list() {
    return this.page.locator('div:has(> h2:text-is("Stored secrets"))')
  }

  /** The "New secret" row */
  get newSecretRow() {
    return this.page.locator('div:has(> input[placeholder="Secret name"]:not([readonly]))')
  }

  /** The row of a stored secret */
  secretRow(name: string) {
    return this.page.locator(`div:has(> input[readonly][value="${name}"])`)
  }

  async addSecret(name: string, value: string) {
    const row = this.newSecretRow
    await row.getByPlaceholder('Secret name').fill(name)
    await row.getByPlaceholder('Secret value').fill(value)
    await row.getByRole('button', { name: 'Add' }).click()
    // the form is cleared once the secret is stored
    await expect(row.getByPlaceholder('Secret name')).toHaveValue('')
  }

  async updateSecret(name: string, value: string) {
    const row = this.secretRow(name)
    await row.getByPlaceholder('Secret value').fill(value)
    await row.getByRole('button', { name: 'check', exact: true }).click()
  }

  async deleteSecret(name: string) {
    await this.secretRow(name).getByRole('button', { name: 'delete', exact: true }).click()
    await confirmDialog(this.page).getByRole('button', { name: 'Delete' }).click()
    await expect(toast(this.page, 'Secret deleted')).toBeVisible()
  }
}
