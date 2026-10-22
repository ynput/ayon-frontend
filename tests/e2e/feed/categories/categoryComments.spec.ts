import { Page } from '@playwright/test'
import { AyonApi } from '../../support/api'
import { apiAs, signInAs } from '../../support/session'
import { toast } from '../../support/ui'
import { OverviewPage } from '../../pages/OverviewPage'
import { CREATOR, EVERYONE, NONE, VIEWER, expect, test, user } from './categoryFixtures'

/** A shot with one task */
const setup = async (api: AyonApi, projectName: string) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  return api.createTask(projectName, {
    folderId: folder.id,
    name: 'lighting',
    taskType: 'Lighting',
  })
}

const openTask = async (page: Page, projectName: string) => {
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.expand('sh010')
  return overview.openDetails('lighting')
}

const commentCategories = (api: AyonApi, projectName: string, taskId: string) => async () =>
  Object.fromEntries(
    (await api.listActivities(projectName, 'task', taskId)).map((a) => [a.body, a.category]),
  )

test.describe('comment categories', () => {
  test('post a comment in a category, then change and clear its category', async ({
    page,
    api,
    projectName,
    setCategories,
  }) => {
    await setCategories([
      { name: 'Director', color: '#44ee9f', access: { [EVERYONE]: CREATOR } },
      { name: 'Private', color: '#ff9a47', access: {} },
    ])
    const task = await setup(api, projectName)
    const panel = await openTask(page, projectName)

    await panel.addComment('Plain note')
    await panel.addCommentInCategory('Needs a warmer key light', 'Director')

    await expect(panel.categoryFlag('Needs a warmer key light')).toHaveText('Director')
    await expect(panel.categoryFlag('Needs a warmer key light')).toHaveAttribute(
      'data-tooltip',
      'Category: Director',
    )
    await expect(panel.categoryFlag('Plain note')).toHaveCount(0)
    await expect.poll(commentCategories(api, projectName, task.id)).toEqual({
      'Needs a warmer key light': 'Director',
      'Plain note': null,
    })

    await panel.changeCommentCategory('Needs a warmer key light', 'Private')
    await expect(panel.categoryFlag('Needs a warmer key light')).toHaveText('Private')
    await expect
      .poll(
        async () =>
          (
            await commentCategories(api, projectName, task.id)()
          )['Needs a warmer key light'],
      )
      .toBe('Private')

    await panel.changeCommentCategory('Needs a warmer key light', 'No category')
    await expect(panel.categoryFlag('Needs a warmer key light')).toHaveCount(0)
    await expect
      .poll(
        async () =>
          (
            await commentCategories(api, projectName, task.id)()
          )['Needs a warmer key light'],
      )
      .toBeNull()
  })

  test('a draft keeps its category after a reload', async ({
    page,
    api,
    projectName,
    setCategories,
  }) => {
    await setCategories([{ name: 'Director', access: { [EVERYONE]: CREATOR } }])
    const task = await setup(api, projectName)
    let panel = await openTask(page, projectName)
    await panel.openCommentBox()
    await panel.pickCategory('Director')
    await panel.commentEditor.pressSequentially('Half written note')
    await expect
      .poll(() =>
        page.evaluate(
          () => Object.keys(localStorage).filter((k) => k.startsWith('ayon-comment-draft/')).length,
        ),
      )
      .toBe(1)

    await page.reload()
    panel = await openTask(page, projectName)
    if (!(await panel.commentEditor.isVisible())) await panel.openCommentBox()
    await expect(panel.commentEditor).toContainText('Half written note')
    await expect(panel.categoryPicker()).toContainText('Director')

    await panel.submitComment()
    await expect(panel.categoryFlag('Half written note')).toHaveText('Director')
    await expect
      .poll(async () => (await commentCategories(api, projectName, task.id)())['Half written note'])
      .toBe('Director')
  })

  test('a user sees the categories they can view and posts only in those they can create in', async ({
    browser,
    api,
    projectName,
    restrictedUser,
    setCategories,
  }) => {
    const alice = await restrictedUser()
    await setCategories([
      { name: 'Posts', color: '#44ee9f', access: { [user(alice.name)]: CREATOR } },
      { name: 'Views', color: '#3b82f6', access: { [user(alice.name)]: VIEWER } },
      { name: 'Hidden', color: '#ff9a47', access: { [user(alice.name)]: NONE } },
    ])
    const task = await setup(api, projectName)
    await api.createComment(projectName, 'task', task.id, 'Plain note')
    for (const category of ['Posts', 'Views', 'Hidden']) {
      await api.createComment(projectName, 'task', task.id, `Note in ${category}`, { category })
    }

    const { context, page } = await signInAs(browser, alice.name, alice.password)
    try {
      const panel = await openTask(page, projectName)
      await expect(panel.comment('Plain note')).toBeVisible()
      await expect(panel.categoryFlag('Note in Posts')).toHaveText('Posts')
      await expect(panel.categoryFlag('Note in Views')).toHaveText('Views')
      await expect(panel.comment('Note in Hidden')).toHaveCount(0)

      await panel.openCommentBox()
      expect(await panel.categoryOptions()).toEqual(['Posts'])
      await panel.pickCategory('Posts')
      await panel.commentEditor.pressSequentially('Reply from Alice')
      await panel.submitComment()
      await expect(panel.categoryFlag('Reply from Alice')).toHaveText('Posts')
      await expect
        .poll(
          async () => (await commentCategories(api, projectName, task.id)())['Reply from Alice'],
        )
        .toBe('Posts')
    } finally {
      await context.close()
    }
  })

  test('the picker is hidden from users with no category to post in, admins always have it', async ({
    page,
    browser,
    api,
    projectName,
    restrictedUser,
    setCategories,
  }) => {
    const alice = await restrictedUser()
    await setCategories([{ name: 'Views', access: { [EVERYONE]: VIEWER } }])
    await setup(api, projectName)

    const { context, page: alicePage } = await signInAs(browser, alice.name, alice.password)
    try {
      const panel = await openTask(alicePage, projectName)
      await panel.openCommentBox()
      // the toolbar is there, the picker (a tag reading "Category") is not
      await expect(panel.newCommentBox.getByRole('button', { name: 'format_bold' })).toBeVisible()
      await expect(panel.newCommentBox.getByText('Category', { exact: true })).toHaveCount(0)
    } finally {
      await context.close()
    }

    // with no categories at all an admin still gets the tag, and it says where to set them up
    await setCategories([])
    const panel = await openTask(page, projectName)
    await panel.openCommentBox()
    await panel.newCommentBox.getByText('Category', { exact: true }).click()
    await expect(toast(page, 'No categories found')).toBeVisible()
  })

  test('a comment whose category was removed says so', async ({
    page,
    api,
    projectName,
    restrictedUser,
    setCategories,
  }, testInfo) => {
    const alice = await restrictedUser()
    await setCategories([
      { name: 'Old', access: { [EVERYONE]: VIEWER } },
      { name: 'Kept', access: { [EVERYONE]: VIEWER } },
    ])
    const task = await setup(api, projectName)
    await api.createComment(projectName, 'task', task.id, 'Note in Old', { category: 'Old' })

    await setCategories([{ name: 'Kept', access: { [EVERYONE]: VIEWER } }])

    const panel = await openTask(page, projectName)
    await expect(panel.categoryFlag('Note in Old')).toHaveText('Old')
    await expect(panel.categoryFlag('Note in Old')).toHaveAttribute(
      'data-tooltip',
      'Category not found. It may have been deleted.',
    )

    // nobody but admins and managers can view a category that no longer exists
    const asAlice = await apiAs(testInfo, alice.name, alice.password)
    try {
      expect(await asAlice.listActivities(projectName, 'task', task.id)).toEqual([])
    } finally {
      await asAlice.dispose()
    }
  })
})
