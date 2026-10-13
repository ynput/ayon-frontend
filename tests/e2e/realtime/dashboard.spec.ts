import { expect, test } from '../fixtures'
import { signInAs } from '../support/session'
import { DashboardTasksPage } from '../pages/DashboardTasksPage'
import { OverviewPage } from '../pages/OverviewPage'
import { LIVE_UPDATE, LiveUpdates } from './live'

test.describe('dashboard live updates', () => {
  test('a task assigned to me elsewhere appears on my open board and follows its status', async ({
    api,
    projectName,
    createUser,
    accessGroup,
    browser,
  }) => {
    test.slow()
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

  // FLAG (app bug): state.project.name is never cleared, so the websocket stays filtered to that project
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

  test('a task created for me is not streamed onto my open board, and shows after a reload', async ({
    api,
    projectName,
    createUser,
    accessGroup,
    browser,
  }) => {
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
    const lgt = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'lgt',
      taskType: 'Lighting',
    })

    const { context, page } = await signInAs(browser, artist.name, artist.password)
    try {
      const live = new LiveUpdates(page)
      const dashboard = new DashboardTasksPage(page)
      await dashboard.goto()
      await dashboard.selectProject(projectName)
      await expect(dashboard.card(anim.id)).toBeVisible()
      await expect(dashboard.card(lgt.id)).toBeHidden()
      await live.expectSubscribed('entity.task.created', projectName)

      const comp = await api.createTask(projectName, {
        folderId: folder.id,
        name: 'comp',
        taskType: 'Compositing',
        assignees: [artist.name],
      })
      // a later assignment is fetched together with, or after, a streamed creation
      await api.updateTask(projectName, lgt.id, { assignees: [artist.name] })

      await expect(dashboard.card(lgt.id)).toContainText('lgt', LIVE_UPDATE)
      await expect(dashboard.card(comp.id)).toBeHidden()

      await dashboard.goto()

      await expect(dashboard.card(comp.id)).toContainText('comp')
      await expect(dashboard.card(anim.id)).toBeVisible()
    } finally {
      await context.close()
    }
  })
})
