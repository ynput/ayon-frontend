import path from 'path'
import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { dialog, menuItem } from '../support/ui'
import { OverviewPage } from '../pages/OverviewPage'

/** a 20 byte text file, previewable in the app */
const NOTES = {
  path: path.join(__dirname, 'fixtures', 'render_notes.txt'),
  name: 'render_notes.txt',
  text: 'Flicker on frame 12',
  size: '20',
}

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

/** A comment on the task with the notes file attached */
const seedCommentWithNotes = async (api: AyonApi, projectName: string, taskId: string) => {
  const fileId = await api.uploadProjectFile(projectName, NOTES.path)
  await api.createCommentWithFiles(projectName, 'task', taskId, 'Notes attached', [fileId])
  return fileId
}

const openTask = async (page: Page, projectName: string) => {
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.expand('sh010')
  return overview.openDetails('lighting')
}

/** The files of the task's comments by body, as the API lists them */
const commentFiles = (api: AyonApi, projectName: string, taskId: string) => async () =>
  (await api.listFeedActivities(projectName, taskId, { activityTypes: ['comment'] })).map((a) => ({
    body: a.body,
    files: a.files.map(({ name, mime, size }) => ({ name, mime, size })),
  }))

test.describe('comment attachments', () => {
  test('attach a file to a new comment', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    const panel = await openTask(page, projectName)
    await panel.openCommentBox()

    await panel.attachFiles(NOTES.path)
    await expect(panel.fileCard(panel.newCommentBox, NOTES.name)).toBeVisible()
    await panel.commentEditor.pressSequentially('Notes attached')
    await panel.submitComment()

    await expect(panel.attachment('Notes attached', NOTES.name)).toBeVisible()
    // the box is empty again, the file went with the comment
    await expect(panel.fileCard(panel.newCommentBox, NOTES.name)).toHaveCount(0)
    await expect.poll(commentFiles(api, projectName, task.id)).toEqual([
      {
        body: 'Notes attached',
        files: [{ name: NOTES.name, mime: 'text/plain', size: NOTES.size }],
      },
    ])
  })

  test('download an attachment', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    const fileId = await seedCommentWithNotes(api, projectName, task.id)
    const panel = await openTask(page, projectName)
    const card = panel.attachment('Notes attached', NOTES.name)
    // FLAG: the download link (with the file size) only shows while hovering the card's footer,
    // which hides the name meanwhile
    await card.locator('footer').hover()
    const download = card.getByRole('link')
    await expect(download).toHaveText(/20 B/)

    // the file opens in a new tab, served inline by the server
    const [tab] = await Promise.all([page.context().waitForEvent('page'), download.click()])
    await tab.waitForLoadState()

    // (the server redirects to the stored file, `.../files/<id>/payload`)
    expect(tab.url()).toContain(`/api/projects/${projectName}/files/${fileId}`)
    await expect(tab.locator('body')).toHaveText(NOTES.text)
  })

  test('preview a text attachment', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    await seedCommentWithNotes(api, projectName, task.id)
    const panel = await openTask(page, projectName)
    const card = panel.attachment('Notes attached', NOTES.name)

    await card.hover()
    // FLAG: icon-only button, its accessible name is the icon ligature
    await card.getByRole('button', { name: 'open_in_full', exact: true }).click()

    // the preview is a full window dialog with the file name as its header and the text in it
    const preview = dialog(page, NOTES.name)
    await expect(preview).toBeVisible()
    await expect(preview.getByRole('textbox')).toHaveValue(`${NOTES.text}\n`)
    await page.keyboard.press('Escape')
    await expect(preview).toBeHidden()
  })

  test('remove an attachment while editing a comment', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    await seedCommentWithNotes(api, projectName, task.id)
    const panel = await openTask(page, projectName)
    const id = await panel.comment('Notes attached').getAttribute('id')
    const comment = panel.root.locator(`.comment[id="${id}"]`)
    await comment.hover()
    await comment.getByRole('button', { name: 'edit_square' }).click()
    const editedCard = panel.fileCard(comment, NOTES.name)
    await expect(editedCard).toBeVisible()

    await editedCard.getByRole('button', { name: 'close', exact: true }).click()
    await expect(editedCard).toHaveCount(0)
    await comment.getByRole('button', { name: 'Save' }).click()

    await expect(comment.locator('[contenteditable="true"]')).toHaveCount(0)
    await expect(panel.comment('Notes attached')).toBeVisible()
    await expect(panel.attachment('Notes attached', NOTES.name)).toHaveCount(0)
    await expect
      .poll(commentFiles(api, projectName, task.id))
      .toEqual([{ body: 'Notes attached', files: [] }])
  })

  test('show only comments with attachments', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    await api.createComment(projectName, 'task', task.id, 'No files here')
    await seedCommentWithNotes(api, projectName, task.id)
    const panel = await openTask(page, projectName)
    await expect(panel.comment('No files here')).toBeVisible()

    await panel.addFeedFilter('Attachments')

    await expect(panel.attachment('Notes attached', NOTES.name)).toBeVisible()
    await expect(panel.comment('No files here')).toBeHidden()
    await expect
      .poll(commentFiles(api, projectName, task.id))
      .toContainEqual({ body: 'No files here', files: [] })
  })

  test('duplicate a comment with its attachment', async ({ page, api, projectName }) => {
    const { task } = await setup(api, projectName)
    const fileId = await seedCommentWithNotes(api, projectName, task.id)
    const panel = await openTask(page, projectName)
    const original = panel.comment('Notes attached')
    const originalId = await original.getAttribute('id')

    await original.hover()
    await original.getByRole('button', { name: 'more_horiz' }).click()
    await menuItem(page, 'Duplicate').click()

    // the box opens with the text, a link to the source comment and a copy of the file
    await expect(panel.commentEditor).toContainText('Notes attached')
    await expect(panel.commentEditor).toContainText('Source')
    await expect(panel.fileCard(panel.newCommentBox, NOTES.name)).toBeVisible()
    await panel.submitComment()

    await expect(panel.root.locator('.feed li.comment')).toHaveCount(2)
    const copy = panel.root.locator(`.feed li.comment:not([id="${originalId}"])`)
    await expect(panel.fileCard(copy, NOTES.name)).toBeVisible()
    await expect.poll(async () => (await commentFiles(api, projectName, task.id)()).length).toBe(2)
    const [newest, oldest] = await api.listFeedActivities(projectName, task.id, {
      activityTypes: ['comment'],
    })
    expect(newest.body).toBe(
      `Notes attached\n\n[Source](source:${originalId}?type=task&id=${task.id})`,
    )
    // the copy owns its own file, the original keeps its own
    expect(newest.files).toEqual([expect.objectContaining({ name: NOTES.name, size: NOTES.size })])
    expect(newest.files[0].id).not.toBe(fileId)
    expect(oldest.files.map((f) => f.id)).toEqual([fileId])
  })
})
