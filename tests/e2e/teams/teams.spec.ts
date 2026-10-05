import { expect, test } from '../fixtures'
import { TeamsPage } from '../pages/TeamsPage'
import { confirmDialog, dialog, menuItem, toast } from '../support/ui'

test.describe('project teams', () => {
  test('create a team', async ({ page, api, projectName }) => {
    await page.goto(`/manageProjects/teams?project=${projectName}`)
    await page.getByRole('button', { name: 'Add New Team' }).click()
    const newTeam = dialog(page, 'Create New Team')
    await expect(newTeam).toBeVisible()
    // FLAG: the "Team Name" label is not associated with its input; it is the autofocused field
    const teamName = newTeam.locator('input:focus')
    await teamName.fill('lighting_team')
    await newTeam.getByRole('button', { name: 'Create New Team' }).click()

    await expect(toast(page, 'Created lighting_team')).toBeVisible()
    await expect(page.getByRole('row', { name: /lighting_team/ })).toBeVisible()
    await expect
      .poll(async () => (await api.listTeams(projectName)).map((t) => t.name))
      .toEqual(['lighting_team'])
  })

  test('delete a team', async ({ page, api, projectName }) => {
    await api.createTeam(projectName, 'keep_team')
    await api.createTeam(projectName, 'old_team')
    await page.goto(`/manageProjects/teams?project=${projectName}`)

    const row = page.getByRole('row', { name: /old_team/ })
    await row.click({ button: 'right' })
    await menuItem(page, 'Delete Team').click()
    await confirmDialog(page).getByRole('button', { name: 'Delete' }).click()

    await expect(row).toBeHidden()
    await expect
      .poll(async () => (await api.listTeams(projectName)).map((t) => t.name))
      .toEqual(['keep_team'])
  })

  // regression: the context menu deleted the previously selected teams instead of the right-clicked one
  test('delete a team that is not selected from its context menu', async ({
    page,
    api,
    projectName,
  }) => {
    await api.createTeam(projectName, 'keep_team')
    await api.createTeam(projectName, 'old_team')
    const teams = new TeamsPage(page)
    await teams.goto(projectName)
    await teams.selectTeam('keep_team')

    await teams.deleteTeam('old_team')

    await expect(teams.teamRow('old_team')).toBeHidden()
    await expect(teams.teamRow('keep_team')).toBeVisible()
    await expect
      .poll(async () => (await api.listTeams(projectName)).map((t) => t.name))
      .toEqual(['keep_team'])
  })

  // regression: the context menu selected a string instead of an array, so the duplicate dialog
  // used the previously selected team (or nothing)
  test('duplicate a team that is not selected from its context menu', async ({
    page,
    api,
    projectName,
    createUser,
    accessGroup,
  }) => {
    const member = await createUser({ accessGroups: { [projectName]: [accessGroup] } })
    await api.createTeam(projectName, 'anim_team', [
      { name: member.name, leader: true, roles: ['lead'] },
    ])
    await api.createTeam(projectName, 'other_team')
    const teams = new TeamsPage(page)
    await teams.goto(projectName)
    await teams.selectTeam('other_team')

    await teams.duplicateTeam('anim_team', 'anim_team_copy')

    await expect(teams.teamRow('anim_team_copy')).toBeVisible()
    await expect
      .poll(() => api.getTeamMembers(projectName, 'anim_team_copy'))
      .toEqual([{ name: member.name, leader: true, roles: ['lead'] }])
    // the other teams are untouched
    expect(await api.getTeamMembers(projectName, 'other_team')).toEqual([])
    expect(await api.getTeamMembers(projectName, 'anim_team')).toHaveLength(1)
  })

  test('add a user to a team', async ({ page, api, projectName, createUser, accessGroup }) => {
    const user = await createUser({ accessGroups: { [projectName]: [accessGroup] } })
    await api.createTeam(projectName, 'fx_team')
    const teams = new TeamsPage(page)
    await teams.goto(projectName)
    await teams.selectTeam('fx_team')

    await teams.addUserToSelectedTeam(user.name, 'fx_team')

    // the "Teams" column of the user
    await expect(teams.userRow(user.name)).toContainText('fx_team')
    await expect
      .poll(async () => (await api.getTeamMembers(projectName, 'fx_team'))?.map((m) => m.name))
      .toEqual([user.name])
  })

  test('make a team member the team leader', async ({
    page,
    api,
    projectName,
    createUser,
    accessGroup,
  }) => {
    const user = await createUser({ accessGroups: { [projectName]: [accessGroup] } })
    await api.createTeam(projectName, 'comp_team', [{ name: user.name }])
    const teams = new TeamsPage(page)
    await teams.goto(projectName)
    await teams.selectTeam('comp_team')
    await teams.selectUser(user.name)

    await teams.setLeader(true)

    // team settings summary
    await expect(page.getByText('0 Members - 1 Leaders')).toBeVisible()
    await expect
      .poll(async () => (await api.getTeamMembers(projectName, 'comp_team'))?.[0]?.leader)
      .toBe(true)
  })
})
