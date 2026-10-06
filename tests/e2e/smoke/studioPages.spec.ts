import { AccountPage } from '../pages/AccountPage'
import { AnatomyPresetsPage } from '../pages/AnatomyPresetsPage'
import { DashboardTasksPage } from '../pages/DashboardTasksPage'
import { InboxPage } from '../pages/InboxPage'
import { adminCredentials } from '../support/env'
import { watchPageHealth } from '../support/pageHealth'
import { signInAs } from '../support/session'
import { button, column, defineRouteTests, expect, heading, test, visible } from './smokeFixtures'

/**
 * Every studio level page opens without crashing, logging errors or failing API calls.
 * Read-only: these tests never save, delete or install anything (see tests/AGENTS.md).
 * Project level pages are in projectPages.spec.ts, addon pages in addonPages.spec.ts.
 */

/** /manageProjects/<tab> for the seeded project */
const manager = (tab: string) => (d: { projectName: string }) =>
  `/manageProjects/${tab}?project=${d.projectName}`

test.describe('smoke: dashboard', () => {
  defineRouteTests([
    {
      name: 'tasks board',
      path: () => '/dashboard/tasks',
      ready: async (page, d) => {
        const dashboard = new DashboardTasksPage(page)
        await visible(page.getByPlaceholder('Filter tasks...'))
        await dashboard.selectProject(d.projectName)
        await expect(dashboard.card(d.task.id)).toBeVisible()
      },
    },
    {
      name: 'tasks list',
      path: () => '/dashboard/tasks?view=list',
      ready: async (page, d) => {
        const dashboard = new DashboardTasksPage(page)
        await visible(page.getByPlaceholder('Filter tasks...'))
        await dashboard.selectProject(d.projectName)
        await expect(dashboard.listRow(d.task.id)).toBeVisible()
      },
    },
    {
      name: 'projects',
      path: () => '/dashboard/projects',
      ready: (page) =>
        visible(
          button(page, 'Create new project'),
          // FLAG: the header cells of this table have no columnheader role, only sort buttons
          page.getByRole('button', { name: 'Label / Name', exact: true }),
        ),
    },
  ])
})

test.describe('smoke: inbox', () => {
  // as a regular user: a manager's or admin's inbox reads every project and fails while another
  // test creates or drops one (see "Cross-project queries" in tests/AGENTS.md)
  for (const tab of ['important', 'other', 'cleared'] as const) {
    test(tab, async ({ browser, createUser }) => {
      const user = await createUser()
      const { context, page } = await signInAs(browser, user.name, user.password)
      try {
        const health = watchPageHealth(page)
        const inbox = new InboxPage(page)
        await inbox.goto(tab)
        await expect(inbox.allCaughtUp).toBeVisible()
        await health.expectHealthy()
      } finally {
        await context.close()
      }
    })
  }
})

test.describe('smoke: projects manager', () => {
  defineRouteTests([
    {
      name: 'anatomy',
      path: manager('anatomy'),
      ready: (page) => visible(heading(page, 'Entity Naming'), button(page, 'Save changes')),
    },
    {
      name: 'project settings',
      path: manager('projectSettings'),
      ready: (page) => visible(column(page, 'Addon'), button(page, 'Save Changes')),
    },
    {
      name: 'project permissions',
      path: manager('permissions'),
      ready: (page) =>
        visible(column(page, 'Access group'), heading(page, 'No access group selected')),
    },
    {
      name: 'project access',
      path: manager('projectAccess'),
      ready: (page) => visible(column(page, 'Project access groups'), button(page, 'Add access')),
    },
    {
      name: 'site settings',
      path: manager('siteSettings'),
      ready: (page) => visible(column(page, 'Site ID'), button(page, 'Save Changes')),
    },
    {
      name: 'roots',
      path: manager('roots'),
      // one form per site; a server without sites shows a placeholder instead
      ready: (page) =>
        visible(
          heading(page, 'No sites were found').or(page.getByRole('button', { name: 'Save' })),
        ),
    },
    {
      name: 'teams',
      path: manager('teams'),
      ready: (page) => visible(button(page, 'Add New Team'), heading(page, 'Team Settings')),
    },
  ])
})

test.describe('smoke: studio settings', () => {
  defineRouteTests([
    {
      name: 'global (server config)',
      path: () => '/settings/server',
      ready: (page) => visible(button(page, 'Save server config'), heading(page, 'Customization')),
    },
    {
      name: 'addons',
      path: () => '/settings/addons',
      ready: (page) =>
        visible(column(page, 'Addons'), column(page, 'Versions'), column(page, 'Bundles')),
    },
    {
      name: 'bundles',
      path: () => '/settings/bundles',
      ready: (page) => visible(button(page, 'Add Bundle'), button(page, 'Upload Addons')),
    },
    {
      name: 'studio settings',
      path: () => '/settings/studio',
      ready: (page) => visible(column(page, 'Addon'), button(page, 'Save Changes')),
    },
    {
      name: 'site settings',
      path: () => '/settings/site',
      ready: (page) => visible(column(page, 'Site ID'), button(page, 'Save Changes')),
    },
    {
      name: 'anatomy presets',
      path: () => '/settings/anatomyPresets',
      ready: (page) => {
        const presets = new AnatomyPresetsPage(page)
        return visible(
          presets.row('AYON default (read only)'),
          presets.editor.sectionHeader('Folder types'),
        )
      },
    },
    {
      name: 'attributes',
      path: () => '/settings/attributes',
      ready: (page) =>
        visible(page.getByPlaceholder('Filter attributes...'), column(page, 'Scopes')),
    },
    {
      name: 'users',
      path: () => '/settings/users',
      ready: (page) =>
        visible(
          page.getByPlaceholder('Filter users...'),
          page.getByRole('cell', { name: adminCredentials().name, exact: true }).first(),
        ),
    },
    {
      name: 'permissions (access groups)',
      path: () => '/settings/accessGroups',
      ready: (page) =>
        visible(button(page, 'New access group'), heading(page, 'No access group selected')),
    },
    {
      name: 'secrets',
      path: () => '/settings/secrets',
      ready: (page) => visible(heading(page, 'Stored secrets'), heading(page, 'New secret')),
    },
  ])
})

test.describe('smoke: studio pages', () => {
  defineRouteTests([
    {
      name: 'events',
      path: () => '/events',
      ready: (page) => visible(heading(page, 'Events Overview'), column(page, 'Topic')),
    },
    {
      name: 'services',
      path: () => '/services',
      ready: (page) => visible(column(page, 'Service name'), button(page, 'New service')),
    },
    {
      name: 'market',
      path: () => '/market',
      ready: (page) => visible(page.getByPlaceholder('Search', { exact: true })),
      // FLAG: the market is read from Ynput Cloud through the server; offline servers answer 503
      skip: async ({ api }) => {
        const res = await api.request.get('/api/market/addons')
        return res.status() === 503 && 'the server is offline, the market needs internet'
      },
    },
    {
      name: 'account: profile',
      path: () => '/account/profile',
      ready: async (page) => {
        await expect(new AccountPage(page).input('Username')).toHaveValue(adminCredentials().name, {
          timeout: 30_000,
        })
      },
    },
    {
      name: 'account: sessions',
      path: () => '/account/sessions',
      ready: (page) => visible(column(page, 'Last active')),
    },
    {
      name: 'account: launchers',
      path: () => '/account/downloads',
      ready: (page) => visible(heading(page, 'Windows Installer'), heading(page, 'All Versions')),
    },
    {
      name: 'API docs',
      path: () => '/doc/api',
      // the backend's Redoc page in an iframe
      ready: (page) =>
        visible(page.getByTitle('apidoc').contentFrame().getByPlaceholder('Search...')),
    },
    {
      name: 'GraphQL explorer',
      path: () => '/explorer',
      // the backend's GraphiQL in an iframe
      ready: (page) =>
        // FLAG: GraphiQL's toolbar buttons are links without a role, found by their text
        visible(page.getByTitle('graphiql').contentFrame().getByText('Prettify', { exact: true })),
    },
  ])
})

// FLAG (app bug): the catch-all route has no path, `<Route element={<ErrorPage code="404" />} />` in
// src/containers/AppRoutes.tsx. A route without a path is a layout route that never matches on its own,
// so unknown URLs render an empty page instead of the 404 page. Fix: add `path="*"`.
// fixed in ynput/ayon-frontend#2417, switch back to test() once it is merged
test.fixme('smoke: an unknown URL shows the 404 page', async ({ page }) => {
  await page.goto('/e2e-no-such-page')
  await expect(heading(page, 'ERROR 404')).toBeVisible({ timeout: 30_000 })
})
