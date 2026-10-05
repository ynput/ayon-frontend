import { expect, test } from '../fixtures'
import { signInAs } from '../support/session'
import { InboxPage } from '../pages/InboxPage'
import { LIVE_UPDATE, LiveUpdates } from './live'

/**
 * An artist has their inbox open while someone else (the admin, through the REST API) mentions
 * them or changes their task: the new message must show without a reload.
 * The artist is not a manager and only has access to the test project, so the inbox only reads
 * this project (see "Cross-project queries" in tests/AGENTS.md).
 */
test.describe('inbox live updates', () => {
  test('a mention appears in my open Important inbox', async ({
    api,
    projectName,
    createUser,
    accessGroup,
    browser,
  }) => {
    const artist = await createUser({
      fullName: 'Inbox Artist',
      accessGroups: { [projectName]: [accessGroup] },
    })
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'comp',
      taskType: 'Compositing',
    })

    const { context, page } = await signInAs(browser, artist.name, artist.password)
    try {
      const live = new LiveUpdates(page)
      const inbox = new InboxPage(page)
      await inbox.goto('important')
      await expect(inbox.allCaughtUp).toBeVisible()
      await live.expectSubscribed('inbox.message', projectName)

      await api.createComment(
        projectName,
        'task',
        task.id,
        `[Inbox Artist](user:${artist.name}) please check the edges`,
      )

      const message = inbox.message('please check the edges')
      await expect(message).toBeVisible(LIVE_UPDATE)
      await expect(message).toContainText('comp')
      await inbox.expectRead(message, false)
      await expect(inbox.allCaughtUp).toBeHidden()
    } finally {
      await context.close()
    }
  })

  test('a status change on my task appears in my open Other inbox', async ({
    api,
    projectName,
    createUser,
    accessGroup,
    browser,
  }) => {
    // assignees must hold a license seat
    const artist = await createUser({
      licensed: true,
      accessGroups: { [projectName]: [accessGroup] },
    })
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'comp',
      taskType: 'Compositing',
      assignees: [artist.name],
    })

    const { context, page } = await signInAs(browser, artist.name, artist.password)
    try {
      const live = new LiveUpdates(page)
      const inbox = new InboxPage(page)
      await inbox.goto('other')
      await expect(inbox.allCaughtUp).toBeVisible()
      await live.expectSubscribed('inbox.message', projectName)

      await api.updateTask(projectName, task.id, { status: 'In progress' })

      const message = inbox.message('sh010 - comp')
      await expect(message).toBeVisible(LIVE_UPDATE)
      await expect(message).toContainText(/Not ready.*In progress/)
    } finally {
      await context.close()
    }
  })
})
