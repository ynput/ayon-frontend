import { Page } from '@playwright/test'
import { AyonApi } from '../../support/api'
import { signInAs } from '../../support/session'
import { OverviewPage } from '../../pages/OverviewPage'
import { CREATOR, EVERYONE, NONE, expect, test } from './categoryFixtures'

const NOTES = ['Director note', 'Private note', 'Plain note']

/** A task with one comment in each category and one without */
const setup = async (api: AyonApi, projectName: string) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const task = await api.createTask(projectName, {
    folderId: folder.id,
    name: 'lighting',
    taskType: 'Lighting',
  })
  await api.createComment(projectName, 'task', task.id, 'Director note', { category: 'Director' })
  await api.createComment(projectName, 'task', task.id, 'Private note', { category: 'Private' })
  await api.createComment(projectName, 'task', task.id, 'Plain note')
}

const openTask = async (page: Page, projectName: string) => {
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.expand('sh010')
  return overview.openDetails('lighting')
}

test.describe('feed category filter', () => {
  test('filter the feed by one category, several categories and no category', async ({
    page,
    api,
    projectName,
    setCategories,
  }) => {
    await setCategories([
      { name: 'Director', access: { [EVERYONE]: CREATOR } },
      { name: 'Private', access: { [EVERYONE]: CREATOR } },
    ])
    await setup(api, projectName)
    const panel = await openTask(page, projectName)
    const expectShown = async (...shown: string[]) => {
      for (const note of NOTES) {
        await expect(panel.comment(note)).toHaveCount(shown.includes(note) ? 1 : 0)
      }
    }
    await expectShown(...NOTES)

    await panel.filterFeedByCategory('Director')
    await expectShown('Director note')

    await panel.categoryFilterChip.getByRole('button', { name: 'close', exact: true }).click()
    // a filter set used before is cached and not refetched, so every step uses a new one
    await panel.filterFeedByCategory('Private', 'Director')
    await expectShown('Director note', 'Private note')

    await panel.categoryFilterChip.getByRole('button', { name: 'close', exact: true }).click()
    await panel.filterFeedByCategory('No category')
    await expectShown('Plain note')
  })

  test('the category filter is only offered to users who can see a category', async ({
    browser,
    api,
    projectName,
    restrictedUser,
    setCategories,
  }) => {
    const alice = await restrictedUser()
    await setCategories([
      { name: 'Director', access: { [EVERYONE]: NONE } },
      { name: 'Private', access: {} },
    ])
    await setup(api, projectName)

    const { context, page } = await signInAs(browser, alice.name, alice.password)
    try {
      const panel = await openTask(page, projectName)
      await expect(panel.comment('Plain note')).toBeVisible()
      const feed = panel.root.locator('.feed')
      await feed.getByRole('textbox', { name: 'Search and filter' }).click()
      // other filters are offered, Category is not
      await expect(
        feed.getByRole('listitem').getByText('Posted date', { exact: true }),
      ).toBeVisible()
      await expect(feed.getByRole('listitem').getByText('Category', { exact: true })).toHaveCount(0)
    } finally {
      await context.close()
    }
  })
})
