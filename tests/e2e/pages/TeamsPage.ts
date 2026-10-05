import { expect, Page } from '@playwright/test'
import { confirmDialog, dialog, formRow, menuItem, switchBody, toast } from '../support/ui'

/**
 * /manageProjects/teams — teams of a project on the left, the project's users in the middle,
 * member and team settings on the right.
 * Only admins, managers and users with an access group on the project are listed, so give test
 * users access: `createUser({ accessGroups: { [projectName]: [accessGroup] } })`.
 */
export class TeamsPage {
  constructor(readonly page: Page) {}

  async goto(project: string) {
    await this.page.goto(`/manageProjects/teams?project=${project}`)
    await expect(this.page.getByRole('button', { name: 'Add New Team' })).toBeVisible()
  }

  /** A row of the team list (user rows also list team names, so match the whole name) */
  teamRow(name: string) {
    return this.page.getByRole('row', { name, exact: true })
  }

  /** A row of the users table */
  userRow(name: string) {
    return this.page.getByRole('row').filter({ hasText: name })
  }

  /** FLAG: primereact DataTable rows do not set aria-selected, selection is only the `p-highlight` class */
  async selectTeam(name: string) {
    await this.teamRow(name).click()
    await expect(this.teamRow(name)).toHaveClass(/\bp-highlight\b/)
  }

  async selectUser(name: string) {
    await this.userRow(name).click()
    await expect(this.userRow(name)).toHaveClass(/\bp-highlight\b/)
  }

  /** Ctrl/Cmd click, keeps the users that are already selected */
  async addUserToSelection(name: string) {
    await this.userRow(name).click({ modifiers: ['ControlOrMeta'] })
    await expect(this.userRow(name)).toHaveClass(/\bp-highlight\b/)
  }

  /** "Add to <team>" from a user's context menu, `team` must be the selected team */
  async addUserToSelectedTeam(user: string, team: string) {
    await this.userRow(user).click({ button: 'right' })
    await menuItem(this.page, `Add to ${team}`).click()
  }

  /** "Leader" switch in the member settings of the selected user on the selected team */
  get leaderRow() {
    return formRow(this.page, 'Leader')
  }

  async setLeader(leader: boolean) {
    const checkbox = this.leaderRow.getByRole('checkbox')
    // also waits for the member settings of the selected user to load
    await expect(checkbox).toBeChecked({ checked: !leader })
    await expect(checkbox).toBeEnabled()
    await switchBody(this.leaderRow).click()
    await expect(checkbox).toBeChecked({ checked: leader })
  }

  /** "Duplicate Team" from the context menu of `source` */
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

  /** "Delete Team" from the context menu of `name` */
  async deleteTeam(name: string) {
    await this.teamRow(name).click({ button: 'right' })
    await menuItem(this.page, 'Delete Team').click()
    await confirmDialog(this.page).getByRole('button', { name: 'Delete' }).click()
  }
}
