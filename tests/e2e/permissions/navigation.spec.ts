import { Page } from '@playwright/test'
import { expect, test } from './restrictedUser'
import { DashboardTasksPage } from '../pages/DashboardTasksPage'
import { ProjectsList } from '../pages/ProjectsList'
import { UsersSettingsPage } from '../pages/UsersSettingsPage'
import { apiAs, signInAs } from '../support/session'
import { menuItem } from '../support/ui'

/** Open the "apps" menu in the header (studio settings, projects settings, events, ...) */
const openAppMenu = async (page: Page) => {
  await page.getByRole('button', { name: 'apps', exact: true }).click()
  await expect(menuItem(page, 'Projects Settings')).toBeVisible()
}

/** A tab of the secondary navigation bar (settings, projects manager, project pages) */
const navTab = (page: Page, name: string) => page.getByRole('link', { name, exact: true })

test.describe('permissions: studio and project access', () => {
  test('a user only sees and opens the projects they have access to', async ({
    api,
    projectName,
    restrictedUser,
    browser,
  }, testInfo) => {
    const user = await restrictedUser()
    // a project the user has no access group on
    const otherProject = await api.createProject()
    const { context, page } = await signInAs(browser, user.name, user.password)
    const userApi = await apiAs(testInfo, user.name, user.password)
    try {
      const dashboard = new DashboardTasksPage(page)
      await dashboard.goto()
      const projects = new ProjectsList(page)
      await projects.search(projectName)
      await expect(projects.row(projectName)).toBeVisible()
      // the list is loaded and filtered on the client, so the other project is not in it at all
      await projects.search(otherProject)
      await expect(projects.row(otherProject)).toHaveCount(0)

      // opening it by URL does not show it, the app sends the user away
      await page.goto(`/projects/${otherProject}/overview`)
      await expect(page.getByText('Project Not Found, Redirecting...')).toBeVisible()
      await expect(page).not.toHaveURL(/\/projects\//)

      const visible = (await userApi.listProjects()).map((p) => p.name)
      expect(visible).toContain(projectName)
      expect(visible).not.toContain(otherProject)
      await expect(userApi.getProject(otherProject)).rejects.toThrow(/failed with 403/)
    } finally {
      await userApi.dispose()
      await context.close()
      await api.deleteProject(otherProject)
    }
  })

  // FLAG (frontend): the redirect away from a project the user cannot open sometimes ends on a blank
  // page at "/" instead of the dashboard (2 of 5 tries locally). `ProjectPageInner` calls
  // `setTimeout(() => navigate('/'), 1500)` in its render body, so every render in the error state
  // queues another redirect that is never cleared. When two of them fire before the `<Navigate>` of
  // the "/" route has run again, it stays mounted and does not redirect
  // (src/pages/ProjectPage/ProjectPage.tsx, `if (error)`).
  test.fixme(
    'opening a project without access by URL lands on the dashboard',
    async ({ api, restrictedUser, browser }) => {
      const user = await restrictedUser()
      const otherProject = await api.createProject()
      const { context, page } = await signInAs(browser, user.name, user.password)
      try {
        // a few tries, the bug is a race
        for (let attempt = 0; attempt < 3; attempt++) {
          await page.goto(`/projects/${otherProject}/overview`)
          await expect(page.getByText('Project Not Found, Redirecting...')).toBeVisible()
          await expect(page).toHaveURL(/\/dashboard\/tasks$/)
          await expect(page.getByPlaceholder('Filter tasks...')).toBeVisible()
        }
      } finally {
        await context.close()
        await api.deleteProject(otherProject)
      }
    },
  )

  test('a regular user is kept out of studio settings and user management', async ({
    restrictedUser,
    browser,
  }, testInfo) => {
    const user = await restrictedUser()
    const { context, page } = await signInAs(browser, user.name, user.password)
    const userApi = await apiAs(testInfo, user.name, user.password)
    try {
      // the app menu only offers site and project settings
      await openAppMenu(page)
      await expect(menuItem(page, 'Site Settings')).toBeVisible()
      await expect(menuItem(page, 'Studio Settings')).toHaveCount(0)
      await expect(menuItem(page, 'Event Viewer')).toHaveCount(0)
      await expect(menuItem(page, 'Services')).toHaveCount(0)

      // user management by URL ends up in the site settings, the only settings tab the user has
      await page.goto('/settings/users')
      await expect(page).toHaveURL(/\/settings\/site$/, { timeout: 30_000 })
      await expect(navTab(page, 'Site settings')).toBeVisible()
      await expect(navTab(page, 'Users')).toHaveCount(0)
      await expect(navTab(page, 'Studio settings')).toHaveCount(0)
      await expect(page.getByPlaceholder('Filter users...')).toHaveCount(0)

      // manager-only pages redirect home
      await page.goto('/events')
      await expect(page).toHaveURL(/\/dashboard\/tasks$/, { timeout: 30_000 })

      // the server refuses to list the studio's users as well
      await expect(userApi.graphql('{ users { edges { node { name } } } }')).rejects.toThrow(
        /list_all_users/,
      )
    } finally {
      await userApi.dispose()
      await context.close()
    }
  })

  test('a regular user only gets site settings and roots in the projects manager', async ({
    api,
    projectName,
    restrictedUser,
    browser,
  }, testInfo) => {
    const user = await restrictedUser()
    const { context, page } = await signInAs(browser, user.name, user.password)
    const userApi = await apiAs(testInfo, user.name, user.password)
    try {
      await page.goto('/manageProjects')
      await expect(page).toHaveURL(/\/manageProjects\/siteSettings/, { timeout: 30_000 })
      await expect(navTab(page, 'Site settings')).toBeVisible()
      await expect(navTab(page, 'Roots')).toBeVisible()
      for (const tab of ['Anatomy', 'Project settings', 'Project permissions', 'Project access']) {
        await expect(navTab(page, tab)).toHaveCount(0)
      }
      await expect(navTab(page, 'Teams')).toHaveCount(0)
      const projects = new ProjectsList(page)
      await expect(projects.row(projectName)).toBeVisible()
      // no "new project" button above the list
      await expect(page.getByRole('button', { name: 'add', exact: true })).toHaveCount(0)

      // the anatomy tab by URL explains why it shows nothing
      await page.goto(`/manageProjects/anatomy?project=${projectName}`)
      await expect(
        page.getByText("You don't have permission to view this project's anatomy"),
      ).toBeVisible({ timeout: 30_000 })

      // and the server refuses to change it
      const anatomy = await api.get(`/api/projects/${projectName}/anatomy`)
      const res = await userApi.request.post(`/api/projects/${projectName}/anatomy`, {
        data: anatomy,
      })
      expect(res.status()).toBe(403)
    } finally {
      await userApi.dispose()
      await context.close()
    }
  })

  test('a manager can open user management and every projects manager tab', async ({
    projectName,
    createUser,
    restrictedUser,
    browser,
  }, testInfo) => {
    const plainUser = await restrictedUser()
    const manager = await createUser({ isManager: true })
    const { context, page } = await signInAs(browser, manager.name, manager.password)
    const managerApi = await apiAs(testInfo, manager.name, manager.password)
    try {
      await openAppMenu(page)
      await expect(menuItem(page, 'Studio Settings')).toBeVisible()
      await expect(menuItem(page, 'Event Viewer')).toBeVisible()

      const users = new UsersSettingsPage(page)
      await users.goto()
      await users.filter(plainUser.name)
      await expect(users.row(plainUser.name)).toBeVisible()
      await expect(navTab(page, 'Users')).toBeVisible()

      await page.goto(`/manageProjects/anatomy?project=${projectName}`)
      for (const tab of ['Anatomy', 'Project settings', 'Project access', 'Teams']) {
        await expect(navTab(page, tab)).toBeVisible({ timeout: 30_000 })
      }

      const data = await managerApi.graphql('{ users(first: 2000) { edges { node { name } } } }')
      expect(data.users.edges.map((e: any) => e.node.name)).toContain(plainUser.name)
    } finally {
      await managerApi.dispose()
      await context.close()
    }
  })
})
