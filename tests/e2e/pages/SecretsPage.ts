import { expect, Page } from '@playwright/test'
import { confirmDialog, toast } from '../support/ui'

// FLAG: secrets are unlabeled rows of inputs: rows are found by their read-only name, buttons by ligature
export class SecretsPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto('/settings/secrets')
    await expect(this.page.getByRole('heading', { name: 'Stored secrets' })).toBeVisible()
  }

  get list() {
    return this.page.locator('div:has(> h2:text-is("Stored secrets"))')
  }

  get newSecretRow() {
    return this.page.locator('div:has(> input[placeholder="Secret name"]:not([readonly]))')
  }

  secretRow(name: string) {
    return this.page.locator(`div:has(> input[readonly][value="${name}"])`)
  }

  async addSecret(name: string, value: string) {
    const row = this.newSecretRow
    await row.getByPlaceholder('Secret name').fill(name)
    await row.getByPlaceholder('Secret value').fill(value)
    await row.getByRole('button', { name: 'Add' }).click()
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
