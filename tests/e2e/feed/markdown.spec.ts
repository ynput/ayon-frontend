import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'

/** A shot with one task */
const setup = async (api: AyonApi, projectName: string) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const task = await api.createTask(projectName, {
    folderId: folder.id,
    name: 'lighting',
    taskType: 'Lighting',
  })
  return { folder, task }
}

const openTask = async (page: Page, projectName: string) => {
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.expand('sh010')
  return overview.openDetails('lighting')
}

const commentBodies = (api: AyonApi, projectName: string, taskId: string) => async () =>
  (await api.listActivities(projectName, 'task', taskId)).map((a) => a.body)

test.describe('markdown in comments', () => {
  test('write a list with code and a link', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    const panel = await openTask(page, projectName)
    await panel.openCommentBox()

    // markdown shortcuts: "- " starts a list, `...` is inline code, urls become links
    await panel.commentEditor.pressSequentially('Before delivery:')
    await panel.commentEditor.press('Enter')
    await panel.commentEditor.pressSequentially('- Bump `exposure` by one stop')
    await panel.commentEditor.press('Enter')
    await panel.commentEditor.pressSequentially('Read https://example.com/notes first')
    await panel.submitComment()

    const comment = panel.comment('Before delivery:')
    await expect(comment.getByRole('listitem')).toHaveText([
      'Bump exposure by one stop',
      'Read https://example.com/notes first',
    ])
    await expect(comment.locator('code')).toHaveText('exposure')
    await expect(comment.getByRole('link', { name: 'https://example.com/notes' })).toHaveAttribute(
      'href',
      'https://example.com/notes',
    )
    await expect
      .poll(commentBodies(api, projectName, task.id))
      .toEqual([
        'Before delivery:\n\n- Bump `exposure` by one stop\n- Read https://example.com/notes first',
      ])
  })

  test('editing a comment keeps its formatting', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    const body = 'Before delivery:\n\n- Bump **exposure** by one stop\n- Run `denoise` again'
    await api.createComment(projectName, 'task', task.id, body)
    const panel = await openTask(page, projectName)
    const id = await panel.comment('Before delivery:').getAttribute('id')
    const comment = panel.root.locator(`.comment[id="${id}"]`)

    // add a word at the end, the rest stays as it is
    await comment.hover()
    await comment.getByRole('button', { name: 'edit_square' }).click()
    const editor = comment.locator('[contenteditable="true"]')
    await expect(editor).toBeFocused()
    await editor.press('ControlOrMeta+End')
    await editor.pressSequentially(' twice')
    await comment.getByRole('button', { name: 'Save' }).click()

    await expect(editor).toHaveCount(0)
    await expect(comment.getByRole('listitem')).toHaveText([
      'Bump exposure by one stop',
      'Run denoise again twice',
    ])
    await expect(comment.locator('strong')).toHaveText('exposure')
    await expect(comment.locator('code')).toHaveText('denoise')
    await expect.poll(commentBodies(api, projectName, task.id)).toEqual([`${body} twice`])
  })
})
