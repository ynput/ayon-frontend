import { expect, Page } from '@playwright/test'
import { confirmDialog, dialog, formRow, menuItem, switchBody, toast } from '../support/ui'

export class TeamsPage {
  constructor(readonly page: Page) {}

  async goto(project: string) {
    await this.page.goto(`/manageProjects/teams?project=${project}`)
    await expect(this.page.getByRole('button', { name: 'Add New Team' })).toBeVisible()
  }

  teamRow(name: string) {
    return this.page.getByRole('row', { name, exact: true })
  }

  userRow(name: string) {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  // FLAG: primereact DataTable rows do not set aria-selected, selection is only the `p-highlight` class
  async selectTeam(name: string) {
    await this.teamRow(name).click()
    await expect(this.teamRow(name)).toHaveClass(/\bp-highlight\b/)
  }

  async selectUser(name: string) {
    await this.userRow(name).click()
    await expect(this.userRow(name)).toHaveClass(/\bp-highlight\b/)
  }

  async addUserToSelection(name: string) {
    await this.userRow(name).click({ modifiers: ['ControlOrMeta'] })
    await expect(this.userRow(name)).toHaveClass(/\bp-highlight\b/)
  }

  async addUserToSelectedTeam(user: string, team: string) {
    await this.userRow(user).click({ button: 'right' })
    await menuItem(this.page, `Add to ${team}`).click()
  }

  get leaderRow() {
    return formRow(this.page, 'Leader')
  }

  async setLeader(leader: boolean) {
    const checkbox = this.leaderRow.getByRole('checkbox')
    await expect(checkbox).toBeChecked({ checked: !leader })
    await expect(checkbox).toBeEnabled()
    await switchBody(this.leaderRow).click()
    await expect(checkbox).toBeChecked({ checked: leader })
  }

  async duplicateTeam(source: string, newName: string) {
    await this.teamRow(source).click({ button: 'right' })
    await menuItem(this.page, 'Duplicate Team').click()
    const duplicate = dialog(this.page, `Duplicate Team - ${source}`)
    await expect(duplicate).toBeVisible()
    await duplicate.getByPlaceholder('New team name...').fill(newName)
    await duplicate.getByRole('button', { name: 'Create' }).click()
    await expect(toast(this.page, `Created ${newName}`)).toBeVisible()
    await expect(duplicate).toBeHidden()
  }

  async deleteTeam(name: string) {
    await this.teamRow(name).click({ button: 'right' })
    await menuItem(this.page, 'Delete Team').click()
    await confirmDialog(this.page).getByRole('button', { name: 'Delete' }).click()
  }
}
