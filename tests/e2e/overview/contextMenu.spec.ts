import { expect, test } from '../fixtures'
import { DetailsPanel } from '../pages/DetailsPanel'
import { OverviewPage } from '../pages/OverviewPage'

test.describe('overview context menu', () => {
  test('create a child folder from a folder row', async ({ page, api, projectName }) => {
    const parent = await api.createFolder(projectName, { name: 'sq010', folderType: 'Sequence' })
    await api.createFolder(projectName, { name: 'assets' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.rowMenu('sq010', 'Create folder')
    await overview.submitCreateDialog('folder', { label: 'sh010', type: 'Shot' })

    await expect(overview.row('sh010')).toBeVisible()
    await expect
      .poll(async () => (await api.listFolders(projectName)).find((f) => f.name === 'sh010'))
      .toMatchObject({ parentId: parent.id, folderType: 'Shot' })
  })

  test('create a root folder from a child folder row', async ({ page, api, projectName }) => {
    const parent = await api.createFolder(projectName, { name: 'sq010', folderType: 'Sequence' })
    await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot', parentId: parent.id })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sq010')

    await overview.rowMenu('sh010', 'Create root folder')
    await overview.submitCreateDialog('folder', { label: 'library', type: 'Library' })

    await expect(overview.row('library')).toBeVisible()
    await expect
      .poll(async () => (await api.listFolders(projectName)).find((f) => f.name === 'library'))
      .toMatchObject({ parentId: null, folderType: 'Library' })
  })

  test('create a task from a folder row', async ({ page, api, projectName }) => {
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    await api.createFolder(projectName, { name: 'sh020', folderType: 'Shot' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.rowMenu('sh010', 'Create task')
    await overview.submitCreateDialog('task', { label: 'layout', type: 'Layout' })

    await overview.expand('sh010')
    await expect(overview.row('layout')).toBeVisible()
    await expect
      .poll(async () =>
        (await api.listTasks(projectName, folder.id)).map((t) => [t.name, t.taskType]),
      )
      .toEqual([['layout', 'Layout']])
  })

  test('create a task next to an existing task', async ({ page, api, projectName }) => {
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    await api.createTask(projectName, { folderId: folder.id, name: 'anim', taskType: 'Animation' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')

    await overview.rowMenu('anim', 'Create task')
    await overview.submitCreateDialog('task', { label: 'lighting', type: 'Lighting' })

    await expect(overview.row('lighting')).toBeVisible()
    await expect
      .poll(async () => (await api.listTasks(projectName, folder.id)).map((t) => t.name).sort())
      .toEqual(['anim', 'lighting'])
  })

  test('move a folder into another folder', async ({ page, api, projectName }) => {
    const target = await api.createFolder(projectName, { name: 'sq020', folderType: 'Sequence' })
    const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.rowMenu('sh010', 'Move')
    await overview.moveTo('sq020')

    await expect(overview.nameCells()).toHaveText([/sq020$/, /sh010$/])
    await expect
      .poll(async () => (await api.getFolder(projectName, shot.id)).parentId)
      .toBe(target.id)
  })

  test('move a task to another folder', async ({ page, api, projectName }) => {
    const source = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const target = await api.createFolder(projectName, { name: 'sh020', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: source.id,
      name: 'comp',
      taskType: 'Compositing',
    })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')

    await overview.rowMenu('comp', 'Move')
    await overview.moveTo('sh020')

    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).folderId)
      .toBe(target.id)
    await expect(overview.nameCells()).toHaveText([/sh010$/, /sh020$/, /comp$/])
  })

  test('expand children opens the whole branch', async ({ page, api, projectName }) => {
    const sequence = await api.createFolder(projectName, { name: 'sq010', folderType: 'Sequence' })
    const shot = await api.createFolder(projectName, {
      name: 'sh010',
      folderType: 'Shot',
      parentId: sequence.id,
    })
    await api.createTask(projectName, { folderId: shot.id, name: 'anim', taskType: 'Animation' })
    await api.createFolder(projectName, { name: 'assets' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await expect(overview.row('sh010')).toBeHidden()

    await overview.rowMenu('sq010', 'Expand children')

    await expect(overview.nameCells()).toHaveText([/sq010$/, /sh010$/, /anim$/, /assets$/])

    await overview.rowMenu('sq010', 'Collapse children')

    await expect(overview.nameCells()).toHaveText([/sq010$/, /assets$/])
  })

  test('rename a task from its row', async ({ page, api, projectName }) => {
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'anim',
      taskType: 'Animation',
    })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')

    await overview.rowMenu('anim', 'Rename')
    const input = page.getByPlaceholder('Task label...')
    await expect(input).toBeFocused()
    await input.fill('Blocking')
    await input.press('Enter')

    await expect(overview.row('Blocking')).toBeVisible()
    await expect
      .poll(async () => {
        const { name, label } = await api.getTask(projectName, task.id)
        return { name, label }
      })
      .toEqual({ name: 'blocking', label: 'Blocking' })
  })

  test('show details opens the details panel', async ({ page, api, projectName }) => {
    await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    await api.createFolder(projectName, { name: 'sh020', folderType: 'Shot' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.rowMenu('sh020', 'Show details')

    await new DetailsPanel(page).expectOpenFor('sh020')
  })
})
