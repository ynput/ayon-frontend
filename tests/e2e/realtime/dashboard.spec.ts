import { expect, test } from '../fixtures'
import { signInAs } from '../support/session'
import { DashboardTasksPage } from '../pages/DashboardTasksPage'
import { OverviewPage } from '../pages/OverviewPage'
import { LIVE_UPDATE, LiveUpdates } from './live'

/**
 * An artist has "My tasks" open while a producer (the admin, through the REST API) assigns and
 * updates tasks: the board must follow without a reload.
 * The artist is not a manager and only has access to the test project, so the board only shows
 * this project (see "Cross-project queries" in tests/AGENTS.md).
 */
test.describe('dashboard live updates', () => {
  test('a task assigned to me elsewhere appears on my open board and follows its status', async ({
    api,
    projectName,
    createUser,
    accessGroup,
    browser,
  }) => {
    // several live updates in a row, each can take up to ~11 s (see LIVE_UPDATE)
    test.slow()
    const artist = await createUser({
      licensed: true,
      accessGroups: { [projectName]: [accessGroup] },
    })
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    // already on the board, shows that it has loaded
    const anim = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'anim',
      taskType: 'Animation',
      assignees: [artist.name],
    })
    const comp = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'comp',
      taskType: 'Compositing',
    })

    const { context, page } = await signInAs(browser, artist.name, artist.password)
    try {
      const live = new LiveUpdates(page)
      const dashboard = new DashboardTasksPage(page)
      await dashboard.goto()
      await dashboard.selectProject(projectName)
      await expect(dashboard.card(anim.id)).toBeVisible()
      await expect(dashboard.card(comp.id)).toBeHidden()
      await live.expectSubscribed('entity.task.assignees_changed', projectName)

      await api.updateTask(projectName, comp.id, { assignees: [artist.name] })

      await expect(dashboard.card(comp.id)).toContainText('comp', LIVE_UPDATE)
      await expect(dashboard.columnHeadingOf(comp.id)).toHaveText(/^Not ready - 2$/)

      await api.updateTask(projectName, comp.id, { status: 'In progress' })

      await expect(dashboard.columnHeadingOf(comp.id)).toHaveText(/^In progress - 1$/, LIVE_UPDATE)
      await expect(dashboard.columnHeadingOf(anim.id)).toHaveText(/^Not ready - 1$/)

      await api.updateTask(projectName, comp.id, { assignees: [] })

      await expect(dashboard.card(comp.id)).toBeHidden(LIVE_UPDATE)
      await expect(dashboard.card(anim.id)).toBeVisible()
    } finally {
      await context.close()
    }
  })

  // FLAG (app bug): after visiting a project, the board no longer gets live updates from any other
  // project. The websocket `auth` message sends `project: state.project.name`
  // (src/AppRoot.tsx, shared/src/context/websocket/WebsocketContext.tsx) and the server then only
  // forwards that project's events (ayon_server/api/messaging.py). Every getProject query sets
  // `state.project.name` (src/services/project/enhancedProject.ts) and nothing clears it on
  // leaving the project, so the cross-project dashboard stays filtered to the last project (opening
  // a task's details panel there does the same through its ProjectContextProvider).
  // fixed in ynput/ayon-frontend#2414, switch back to test() once it is merged
  test.fixme(
    'my open board still updates after I come from another project',
    async ({ api, projectName, createUser, accessGroup, browser }) => {
      test.setTimeout(120_000)
      const otherProject = await api.createProject()
      try {
        const artist = await createUser({
          licensed: true,
          accessGroups: { [projectName]: [accessGroup], [otherProject]: [accessGroup] },
        })
        const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
        const anim = await api.createTask(projectName, {
          folderId: folder.id,
          name: 'anim',
          taskType: 'Animation',
          assignees: [artist.name],
        })
        const comp = await api.createTask(projectName, {
          folderId: folder.id,
          name: 'comp',
          taskType: 'Compositing',
        })

        const { context, page } = await signInAs(browser, artist.name, artist.password)
        try {
          const live = new LiveUpdates(page)
          await new OverviewPage(page).goto(otherProject)
          // back home through the header, without reloading the app
          await page.getByRole('link', { name: 'home Home' }).click()
          const dashboard = new DashboardTasksPage(page)
          await expect(page.getByPlaceholder('Filter tasks...')).toBeVisible()
          await dashboard.selectProject(projectName)
          await expect(dashboard.card(anim.id)).toBeVisible()
          await live.expectSubscribed('entity.task.assignees_changed', projectName)

          await api.updateTask(projectName, comp.id, { assignees: [artist.name] })

          await expect(dashboard.card(comp.id)).toContainText('comp', LIVE_UPDATE)
        } finally {
          await context.close()
        }
      } finally {
        await api.deleteProject(otherProject)
      }
    },
  )

  // FLAG (app bug): the board ignores `entity.task.created`. The GetKanban realtime handler
  // (shared/src/api/queries/userDashboard/getUserDashboard.ts) only acts on events whose summary
  // carries a new value (status, tags, assignees, type) and returns early for everything else, so a
  // task created with me as assignee only shows after a reload.
  // fixed in ynput/ayon-frontend#2413, switch back to test() once it is merged
  test.fixme(
    'a task created for me elsewhere appears on my open board',
    async ({ api, projectName, createUser, accessGroup, browser }) => {
      const artist = await createUser({
        licensed: true,
        accessGroups: { [projectName]: [accessGroup] },
      })
      const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
      const anim = await api.createTask(projectName, {
        folderId: folder.id,
        name: 'anim',
        taskType: 'Animation',
        assignees: [artist.name],
      })

      const { context, page } = await signInAs(browser, artist.name, artist.password)
      try {
        const live = new LiveUpdates(page)
        const dashboard = new DashboardTasksPage(page)
        await dashboard.goto()
        await dashboard.selectProject(projectName)
        await expect(dashboard.card(anim.id)).toBeVisible()
        await live.expectSubscribed('entity.task.created', projectName)

        const comp = await api.createTask(projectName, {
          folderId: folder.id,
          name: 'comp',
          taskType: 'Compositing',
          assignees: [artist.name],
        })

        await expect(dashboard.card(comp.id)).toContainText('comp', LIVE_UPDATE)
      } finally {
        await context.close()
      }
    },
  )
})
