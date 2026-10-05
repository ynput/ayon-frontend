import { expect, test } from '../fixtures'
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
})
