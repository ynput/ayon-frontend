import { expect, Page } from '@playwright/test'
import { confirmDialog, dialog, menuItem, toast } from '../support/ui'
import { ProjectsList } from './ProjectsList'
import { SettingsEditor } from './SettingsEditor'

/** /manageProjects — project list on the left, anatomy/settings/permissions tabs on the right */
export class ProjectsManagerPage {
  readonly projects: ProjectsList
  readonly anatomy: SettingsEditor

  constructor(readonly page: Page) {
    this.projects = new ProjectsList(page)
    this.anatomy = new SettingsEditor(page)
  }

  async goto(tab = 'anatomy', project?: string) {
    await this.page.goto(`/manageProjects/${tab}${project ? `?project=${project}` : ''}`)
  }

  projectRow(name: string) {
    return this.projects.row(name)
  }

  async createProject({ label, code }: { label: string; code?: string }) {
    await this.page.getByRole('button', { name: 'add', exact: true }).first().click()
    const createDialog = dialog(this.page, 'Create a new project')
    await expect(createDialog).toBeVisible()
    // the project name is generated from the label
    await createDialog.getByLabel('Project label').fill(label)
    if (code) await createDialog.getByPlaceholder('Project code').fill(code)
    // "Create Project" ignores clicks until the anatomy editor has loaded
    await expect(createDialog.getByRole('heading', { name: 'Entity Naming' })).toBeVisible()
    await createDialog.getByRole('button', { name: 'Create Project' }).click()
    // deploying a project creates a database schema, which can take a while on a busy server
    await expect(toast(this.page, 'Project created')).toBeVisible({ timeout: 30_000 })
    await expect(createDialog).toBeHidden()
  }

  async archiveProject(name: string) {
    await this.projects.openContextMenu(name)
    await menuItem(this.page, 'Archive').click()
  }

  /** Archived projects are hidden from the list until this is toggled on */
  async showArchived() {
    await this.page.getByRole('button', { name: 'more_horiz' }).first().click()
    await menuItem(this.page, 'Show archived').click()
  }

  /** Projects must be archived before they can be deleted */
  async deleteProject(name: string) {
    await this.projects.openContextMenu(name)
    await menuItem(this.page, 'Delete').click()
    const confirm = confirmDialog(this.page)
    await expect(confirm).toContainText(name)
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(toast(this.page, `Project: ${name} deleted`)).toBeVisible()
  }

  async activateProject(name: string) {
    await this.projects.openContextMenu(name)
    await menuItem(this.page, 'Activate').click()
  }

  async renameProject(name: string, label: string) {
    await this.projects.openContextMenu(name)
    await menuItem(this.page, 'Rename project').click()
    const input = this.page.getByPlaceholder('Project label')
    await expect(input).toBeFocused()
    await input.fill(label)
    await input.press('Enter')
    await expect(input).toBeHidden()
  }

  async saveAnatomy() {
    await this.page.getByRole('button', { name: 'Save changes' }).click()
    await expect(toast(this.page, 'Anatomy saved')).toBeVisible()
  }

  get accessUsersTable() {
    return this.page
      .getByRole('table')
      .filter({ has: this.page.getByRole('columnheader', { name: 'Project access groups' }) })
  }

  accessUserRow(user: string) {
    return this.accessUsersTable.getByRole('row').filter({ hasText: user })
  }

  async addProjectAccess(user: string, accessGroup: string) {
    await this.accessUserRow(user).click({ button: 'right' })
    await menuItem(this.page, 'Add access').click()
    const addAccess = dialog(this.page, `Add access for ${user}`)
    await expect(addAccess).toBeVisible()
    const group = addAccess.getByTestId(`access-group-${accessGroup}`)
    await group.click()
    // FLAG: the access group items are plain divs; being picked is only the `selected` class
    await expect(group).toHaveClass(/\bselected\b/)
    await addAccess.getByRole('button', { name: 'Save' }).click()
    await expect(toast(this.page, 'Access added')).toBeVisible()
    await expect(addAccess).toBeHidden()
  }
}
