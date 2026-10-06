import { expect, Page } from '@playwright/test'
import { confirmDialog, dialog, menuItem, toast } from '../support/ui'
import { SettingsEditor } from './SettingsEditor'

export class AnatomyPresetsPage {
  readonly editor: SettingsEditor

  constructor(readonly page: Page) {
    this.editor = new SettingsEditor(page)
  }

  async goto() {
    await this.page.goto('/settings/anatomyPresets')
    await expect(this.row('AYON default (read only)')).toBeVisible({ timeout: 30_000 })
    await expect(this.editor.sectionHeader('Folder types')).toBeVisible()
  }

  // the primary preset's row name ends with an extra "check" (its icon)
  row(name: string) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return this.page.getByRole('row', { name: new RegExp(`^${escaped}( check)?$`) })
  }

  // FLAG: primereact DataTable rows do not set aria-selected, selection is only the `p-highlight` class
  async select(name: string) {
    await this.row(name).click()
    await expect(this.row(name)).toHaveClass(/\bp-highlight\b/)
  }

  get setAsPrimaryButton() {
    return this.page.getByRole('button', { name: 'Set as primary' })
  }

  async saveAsNewPreset(name: string) {
    await this.page.getByRole('button', { name: 'Save as a new preset' }).click()
    const nameDialog = dialog(this.page, 'Create New Preset')
    await expect(nameDialog).toBeVisible()
    await nameDialog.getByPlaceholder('Preset name').fill(name)
    await nameDialog.getByRole('button', { name: 'Save' }).click()
    await expect(toast(this.page, `Preset ${name} saved`)).toBeVisible()
    await expect(nameDialog).toBeHidden()
  }

  async openRenameDialog(name: string) {
    await this.row(name).click({ button: 'right' })
    await menuItem(this.page, 'Rename').click()
    const nameDialog = dialog(this.page, 'Rename Preset')
    await expect(nameDialog).toBeVisible()
    return nameDialog
  }

  async renamePreset(name: string, newName: string) {
    const nameDialog = await this.openRenameDialog(name)
    await nameDialog.getByPlaceholder('New preset name').fill(newName)
    await nameDialog.getByRole('button', { name: 'Save' }).click()
    await expect(toast(this.page, `Preset renamed to ${newName}`)).toBeVisible()
    await expect(nameDialog).toBeHidden()
  }

  async deletePreset(name: string) {
    await this.row(name).click({ button: 'right' })
    await menuItem(this.page, 'Delete').click()
    const confirm = confirmDialog(this.page)
    await expect(confirm).toContainText(`Preset: ${name}`)
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(toast(this.page, `Preset: ${name} deleted`)).toBeVisible()
  }
}
