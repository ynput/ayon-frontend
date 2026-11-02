import { signInAs } from '@ynput/ayon-e2e'
import { apiAs } from '../../support/api'
import { InboxPage } from '../../pages/InboxPage'
import { NONE, VIEWER, expect, test, user } from './categoryFixtures'

test.describe('comment categories in the inbox', () => {
  test('mentions reach the inbox only in categories the user can view', async ({
    browser,
    api,
    projectName,
    restrictedUser,
    setCategories,
  }, testInfo) => {
    // not a manager: a manager's inbox reads every project (see tests/AGENTS.md)
    const alice = await restrictedUser({}, { fullName: 'Alice Archer' })
    await setCategories([
      { name: 'Director', color: '#44ee9f', access: { [user(alice.name)]: VIEWER } },
      { name: 'Private', color: '#ff9a47', access: { [user(alice.name)]: NONE } },
    ])
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    // one task per mention, so each is its own inbox row
    for (const [task, category] of [
      ['lighting', 'Director'],
      ['comp', 'Private'],
      ['layout', null],
    ] as const) {
      const { id } = await api.createTask(projectName, { folderId: folder.id, name: task })
      await api.createComment(
        projectName,
        'task',
        id,
        `[Alice Archer](user:${alice.name}) ${task} notes`,
        { category },
      )
    }

    const asAlice = await apiAs(testInfo, alice.name, alice.password)
    try {
      await expect
        .poll(async () =>
          (
            await asAlice.listInboxMessages({ important: true })
          )
            .filter((m) => m.projectName === projectName)
            .map((m) => m.body.replace(/^.*\) /, ''))
            .sort(),
        )
        .toEqual(['layout notes', 'lighting notes'])
    } finally {
      await asAlice.dispose()
    }

    const { context, page } = await signInAs(browser, alice.name, alice.password)
    try {
      const inbox = new InboxPage(page)
      await inbox.goto('important', projectName)
      await expect(inbox.message('lighting notes')).toBeVisible()
      await expect(inbox.message('layout notes')).toBeVisible()
      await expect(inbox.message('comp notes')).toHaveCount(0)
      await expect(
        inbox.message('lighting notes').getByRole('img', { name: 'Director' }),
      ).toBeVisible()
      await expect(inbox.message('layout notes').locator('.categories')).toHaveCount(0)
    } finally {
      await context.close()
    }
  })
})
