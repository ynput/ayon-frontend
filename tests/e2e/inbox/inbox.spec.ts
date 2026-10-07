import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { InboxPage } from '../pages/InboxPage'
import { apiAs, signInAs } from '../support/session'

const createArtist = async (
  createUser: AyonApi['createUser'],
  projectName: string,
  accessGroup: string,
  options: { licensed?: boolean } = {},
) =>
  createUser({
    fullName: 'Inbox Artist',
    accessGroups: { [projectName]: [accessGroup] },
    ...options,
  })

test.describe('inbox', () => {
  test('a status change on my task lands under Other, not Important', async ({
    api,
    projectName,
    createUser,
    accessGroup,
    browser,
  }, testInfo) => {
    const artist = await createArtist(createUser, projectName, accessGroup, { licensed: true })
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'comp',
      taskType: 'Compositing',
      assignees: [artist.name],
    })
    await api.updateTask(projectName, task.id, { status: 'In progress' })

    const { context, page } = await signInAs(browser, artist.name, artist.password)
    const artistApi = await apiAs(testInfo, artist.name, artist.password)
    try {
      const inbox = new InboxPage(page)
      await inbox.goto('other')
      const message = inbox.message('sh010 - comp')
      // the backend creates the activity from an event, so give it a moment
      await expect(message).toBeVisible({ timeout: 30_000 })
      await expect(message).toContainText(/Not ready.*In progress/)

      await inbox.goto('important')
      await expect(inbox.allCaughtUp).toBeVisible()
      await expect(inbox.message('sh010 - comp')).toBeHidden()

      expect(
        (await artistApi.listInboxMessages({ important: false, active: true })).map((m) => [
          m.activityType,
          m.originId,
        ]),
      ).toContainEqual(['status.change', task.id])
      expect(await artistApi.listInboxMessages({ important: true, active: true })).toEqual([])
    } finally {
      await artistApi.dispose()
      await context.close()
    }
  })

  test('mark a message as read and unread', async ({
    api,
    projectName,
    createUser,
    accessGroup,
    browser,
  }, testInfo) => {
    const artist = await createArtist(createUser, projectName, accessGroup)
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'comp',
      taskType: 'Compositing',
    })
    await api.createComment(
      projectName,
      'task',
      task.id,
      `[Inbox Artist](user:${artist.name}) please read this`,
    )

    const { context, page } = await signInAs(browser, artist.name, artist.password)
    const artistApi = await apiAs(testInfo, artist.name, artist.password)
    const readState = async () =>
      (await artistApi.listInboxMessages({ important: true, active: true })).map((m) => m.read)
    try {
      const inbox = new InboxPage(page)
      await inbox.goto('important')
      const message = inbox.message('please read this')
      await expect(message).toBeVisible({ timeout: 30_000 })
      await inbox.expectRead(message, false)

      await inbox.messageAction(message, 'Mark as read')

      await inbox.expectRead(message, true)
      await expect.poll(readState).toEqual([true])

      await inbox.messageAction(message, 'Mark as unread')

      await inbox.expectRead(message, false)
      await expect.poll(readState).toEqual([false])
    } finally {
      await artistApi.dispose()
      await context.close()
    }
  })

  test('clear all messages of a tab', async ({
    api,
    projectName,
    createUser,
    accessGroup,
    browser,
  }, testInfo) => {
    const artist = await createArtist(createUser, projectName, accessGroup)
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const comp = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'comp',
      taskType: 'Compositing',
    })
    const anim = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'anim',
      taskType: 'Animation',
    })
    await api.createComment(projectName, 'task', comp.id, `[Inbox Artist](user:${artist.name}) one`)
    await api.createComment(projectName, 'task', anim.id, `[Inbox Artist](user:${artist.name}) two`)

    const { context, page } = await signInAs(browser, artist.name, artist.password)
    const artistApi = await apiAs(testInfo, artist.name, artist.password)
    try {
      const inbox = new InboxPage(page)
      await inbox.goto('important')
      await expect(inbox.messages).toHaveCount(2, { timeout: 30_000 })

      await inbox.clearAll()

      await expect(inbox.allCaughtUp).toBeVisible()
      await expect(inbox.messages).toHaveCount(0)
      await expect
        .poll(async () => (await artistApi.listInboxMessages({ active: true })).length)
        .toBe(0)
      await expect
        .poll(async () =>
          (await artistApi.listInboxMessages({ active: false })).map((m) => m.originId).sort(),
        )
        .toEqual([comp.id, anim.id].sort())

      await inbox.goto('cleared')
      await expect(inbox.messages).toHaveCount(2, { timeout: 30_000 })
    } finally {
      await artistApi.dispose()
      await context.close()
    }
  })
})
