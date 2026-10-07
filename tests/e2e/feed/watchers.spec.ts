import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { InboxPage } from '../pages/InboxPage'
import { OverviewPage } from '../pages/OverviewPage'
import { adminCredentials } from '../support/env'
import { apiAs, signInAs } from '../support/session'

const setup = async (api: AyonApi, projectName: string) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const task = await api.createTask(projectName, {
    folderId: folder.id,
    name: 'comp',
    taskType: 'Compositing',
  })
  return { folder, task }
}

const openTask = async (page: Page, projectName: string) => {
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.expand('sh010')
  return overview.openDetails('comp')
}

test.describe('watchers', () => {
  test('watch a task', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    const admin = adminCredentials().name
    const panel = await openTask(page, projectName)
    await expect(panel.watchersButton).toHaveText('notifications')

    await panel.setWatching(true)

    await expect.poll(() => api.getWatchers(projectName, 'task', task.id)).toEqual([admin])
  })

  test('stop watching a task', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    const admin = adminCredentials().name
    await api.setWatchers(projectName, 'task', task.id, [admin])
    const panel = await openTask(page, projectName)
    await expect(panel.watchersButton).toHaveText('notifications_active')

    await panel.setWatching(false)

    await expect.poll(() => api.getWatchers(projectName, 'task', task.id)).toEqual([])
  })

  test('add another user as a watcher', async ({
    page,
    api,
    projectName,
    createUser,
    accessGroup,
  }) => {
    // the dropdown offers the users that can be assigned, which needs a license seat
    const artist = await createUser({
      licensed: true,
      accessGroups: { [projectName]: [accessGroup] },
    })
    const { task } = await setup(api, projectName)
    const panel = await openTask(page, projectName)

    await panel.toggleWatchers(artist.name)

    await expect(panel.watchersButton).toHaveText('notifications')
    await expect.poll(() => api.getWatchers(projectName, 'task', task.id)).toEqual([artist.name])
  })

  test('a watcher finds status changes of the task in their inbox', async ({
    page,
    api,
    projectName,
    createUser,
    accessGroup,
    browser,
  }, testInfo) => {
    const artist = await createUser({ accessGroups: { [projectName]: [accessGroup] } })
    const { task } = await setup(api, projectName)
    await api.setWatchers(projectName, 'task', task.id, [artist.name])
    const panel = await openTask(page, projectName)

    await panel.setStatus('In progress')

    const artistApi = await apiAs(testInfo, artist.name, artist.password)
    try {
      await expect
        .poll(
          async () =>
            (
              await artistApi.listInboxMessages({ important: false, active: true })
            ).map((m) => [m.activityType, m.originId]),
          { timeout: 30_000 },
        )
        .toContainEqual(['status.change', task.id])
    } finally {
      await artistApi.dispose()
    }
    const session = await signInAs(browser, artist.name, artist.password)
    try {
      const inbox = new InboxPage(session.page)
      await inbox.goto('other')
      await expect(inbox.message('sh010 - comp')).toContainText(/Not ready.*In progress/)
    } finally {
      await session.context.close()
    }
  })
})
