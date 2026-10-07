import { expect, Page } from '@playwright/test'
import { switchBody, toast } from '../support/ui'
import { SettingsEditor } from './SettingsEditor'

export class AccessGroupsPage {
  readonly editor: SettingsEditor

  constructor(readonly page: Page) {
    this.editor = new SettingsEditor(page)
  }

  async goto() {
    await this.page.goto('/settings/accessGroups')
    await expect(this.page.getByRole('button', { name: 'New access group' })).toBeVisible()
  }

  row(name: string) {
    return this.page.getByRole('row', { name, exact: true })
  }

  async select(name: string) {
    await this.row(name).click()
    await expect(this.editor.sectionHeader('Studio permissions')).toBeVisible()
  }

  restrictionCheckbox(title: string) {
    return this.editor.sectionHeader(title).getByRole('checkbox')
  }

  async setRestriction(title: string, enabled: boolean) {
    const checkbox = this.restrictionCheckbox(title)
    await expect(checkbox).toBeChecked({ checked: !enabled })
    await switchBody(this.editor.sectionHeader(title)).click()
    await expect(checkbox).toBeChecked({ checked: enabled })
  }

  async save() {
    await this.page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(toast(this.page, 'Project access group settings saved')).toBeVisible()
  }
}
