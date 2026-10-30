import { expect, Page } from '@playwright/test'
import { dialog, toast } from '@ynput/ayon-e2e'
import { SettingsEditor } from './SettingsEditor'

const LIST = 'root_activity_categories'

/** Project settings → Power Pack → Activity Categories */
export class CategorySettingsPage {
  readonly editor: SettingsEditor

  constructor(readonly page: Page) {
    this.editor = new SettingsEditor(page)
  }

  async goto(project: string) {
    await this.page.goto(`/manageProjects/projectSettings?project=${project}`)
    await this.page.getByText('Power Pack', { exact: true }).click()
    // FLAG: the addon's root section header has no heading of its own, so its toggler is the first one
    await this.page.locator('.panel-header .panel-toggler').first().click()
    await this.editor.expand('Activity Categories')
  }

  /** Adds a category at `index` (new items go last) */
  async addCategory(index: number, name: string, color: string) {
    await this.editor.addItem(LIST)
    await this.editor.fillText(`${LIST}_${index}_name`, name)
    await this.editor.setColor(`${LIST}_${index}_color`, color)
  }

  async openAccess(index: number) {
    await this.editor.field(`${LIST}_${index}_access`).getByRole('button').first().click()
    const editor = new AccessEditorDialog(this.page)
    await expect(editor.root).toBeVisible()
    return editor
  }

  async save() {
    await this.page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(toast(this.page, /saved/i)).toBeVisible()
  }
}

/** "Edit Access" dialog of an access widget */
export class AccessEditorDialog {
  readonly root

  constructor(readonly page: Page) {
    this.root = dialog(page, 'Edit Access')
  }

  get search() {
    return this.root.getByPlaceholder('Add people or access groups')
  }

  // FLAG: neither search results nor access rows have a role; both are the element around the `.title-label`
  private row(label: string) {
    return this.root
      .locator('div:has(> .title-label)')
      .filter({ has: this.page.locator('.title-label', { hasText: label }) })
  }

  /** Adds a user (by full name), team or access group; it starts as Viewer. `label` must match only it */
  async add(label: string) {
    await this.search.fill(label)
    await expect(this.row(label).first()).toBeVisible()
    // the result list re-renders while it settles, so pick the first result with Enter
    await this.search.press('Enter')
    await expect(this.row(label).locator('.dropdown')).toBeVisible()
  }

  async setLevel(label: string, level: 'No Access' | 'Viewer' | 'Creator') {
    await this.row(label).locator('.dropdown').click()
    await this.page.locator('.options li').filter({ hasText: level }).first().click()
    await expect(this.row(label).locator('.dropdown')).toContainText(level)
  }

  async remove(label: string) {
    await this.row(label).getByRole('button', { name: 'close', exact: true }).click()
    await expect(this.row(label)).toHaveCount(0)
  }

  async submit() {
    await this.root.getByRole('button', { name: 'Submit', exact: true }).click()
    await expect(this.root).toBeHidden()
  }
}
