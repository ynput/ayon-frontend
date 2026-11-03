import { expect, test } from '../fixtures'
import { OverviewPage } from '../pages/OverviewPage'
import { signInAs } from '@ynput/ayon-e2e'
import { apiAs } from '../support/api'

test.describe('mentions and inbox', () => {
  test('mention a user in a comment', async ({ page, api, projectName, createUser }) => {
    const fullName = `Mention${Math.random().toString(36).slice(2, 8)} Artist`
    const artist = await createUser({ fullName, isManager: true })
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'comp',
      taskType: 'Compositing',
    })

    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')
    const panel = await overview.openDetails('comp')
    await panel.addCommentMentioning('Please check this', fullName)

    await expect(panel.comment('Please check this')).toContainText(fullName)
    await expect
      .poll(async () => (await api.listActivities(projectName, 'task', task.id))[0]?.body)
      .toContain(`(user:${artist.name})`)
  })

  test('a mentioned user finds the comment in their inbox and clears it', async ({
    api,
    projectName,
    createUser,
    accessGroup,
    browser,
  }, testInfo) => {
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
    await api.createComment(
      projectName,
      'task',
      task.id,
      `[Inbox Artist](user:${artist.name}) notes for you`,
    )

    const { context, page } = await signInAs(browser, artist.name, artist.password)
    const artistApi = await apiAs(testInfo, artist.name, artist.password)
    try {
      await page.goto('/inbox/important')
      const message = page.locator('.inbox-message').filter({ hasText: 'notes for you' })
      await expect(message).toBeVisible({ timeout: 30_000 })
      await expect(message).toContainText('comp')

      await message.hover()
      await message.locator('.clear').click()

      await expect(message).toBeHidden()
      // the message hides before the server has it, leaving the page now would cancel the request
      await expect
        .poll(async () => (await artistApi.listInboxMessages({ active: false })).map((m) => m.body))
        .toEqual([expect.stringContaining('notes for you')])
      await page.goto('/inbox/cleared')
      await expect(page.locator('.inbox-message').filter({ hasText: 'notes for you' })).toBeVisible(
        {
          timeout: 30_000,
        },
      )
    } finally {
      await context.close()
    }
  })
})
