import { expect, test } from '../fixtures'
import { adminCredentials } from '../support/env'
import { menuItem } from '../support/ui'
import { DashboardProjectsPage } from '../pages/DashboardProjectsPage'
import { DashboardTasksPage } from '../pages/DashboardTasksPage'

test.describe('dashboard projects', () => {
  test('pin a project from the menu of a project that is not selected', async ({
    page,
    api,
    projectName,
  }) => {
    const me = adminCredentials().name
    // the shared prefix lets one search show both projects
    const other = await api.createProject({ name: `${projectName}_pin` })
    const pinnedProjects = async (): Promise<string[]> =>
      (await api.getUser(me)).data?.frontendPreferences?.pinnedProjects ?? []
    try {
      const dashboard = new DashboardTasksPage(page)
      await dashboard.goto()
      const list = dashboard.projects
      await list.search(projectName)
      await list.row(projectName, { exact: true }).click()
      await list.expectSelection([projectName])

      await list.row(other, { exact: true }).click({ button: 'right' })

      await expect(menuItem(page, 'Pin')).toBeVisible()
      await list.expectSelection([projectName], [other])

      await menuItem(page, 'Pin').click()

      await expect.poll(pinnedProjects).toContain(other)
      expect(await pinnedProjects()).not.toContain(projectName)
      await expect(list.row(other, { exact: true }).locator('.pinned')).toBeVisible()
      await expect(list.row(projectName, { exact: true }).locator('.pinned')).toHaveCount(0)
      await list.expectSelection([projectName], [other])
    } finally {
      const pinned = await pinnedProjects()
      if (pinned.includes(other)) {
        await api.patch(`/api/users/${me}/frontendPreferences`, {
          pinnedProjects: pinned.filter((name) => name !== other),
        })
      }
      await api.deleteProject(other)
    }
  })

  test('archive a project from the menu of a project that is not selected', async ({
    page,
    api,
    projectName,
  }) => {
    const other = await api.createProject()
    try {
      const projects = new DashboardProjectsPage(page)
      await projects.onlyShow([projectName, other])
      await projects.goto()
      await projects.row(projectName).click()
      await projects.expectSelection([projectName])

      await projects.row(other).click({ button: 'right' })

      await expect(menuItem(page, 'Archive')).toBeVisible()
      await projects.expectSelection([projectName], [other])

      await menuItem(page, 'Archive').click()

      await expect.poll(async () => (await api.getProject(other)).active).toBe(false)
      expect((await api.getProject(projectName)).active).toBe(true)
      await expect(projects.row(other)).toHaveClass(/\binactive\b/)
      await expect(projects.row(projectName)).not.toHaveClass(/\binactive\b/)
      await projects.expectSelection([projectName])
    } finally {
      await api.deleteProject(other)
    }
  })
})
