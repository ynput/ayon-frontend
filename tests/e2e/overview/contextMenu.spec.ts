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

  test('move preselects and scrolls to the last destination', async ({
    page,
    api,
    projectName,
  }) => {
    const first = await api.createFolder(projectName, { name: 'a_first' })
    const second = await api.createFolder(projectName, { name: 'a_second' })
    for (let i = 0; i < 50; i++) {
      await api.createFolder(projectName, { name: `filler_${String(i).padStart(2, '0')}` })
    }
    const target = await api.createFolder(projectName, { name: 'z_destination' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.rowMenu('a_first', 'Move')
    const picker = overview.moveDialog()
    const destination = picker.getByRole('row').filter({ hasText: 'z_destination' })
    await expect(picker.getByText('filler_00', { exact: true })).toBeVisible()
    await expect(destination).toBeHidden()
    await picker.getByRole('table').hover()
    await page.mouse.wheel(0, 2400)
    await overview.moveTo('z_destination')
    await expect
      .poll(async () => (await api.getFolder(projectName, first.id)).parentId)
      .toBe(target.id)

    await overview.rowMenu('a_second', 'Move')
    // the picker marks selected cells with a class, not aria-selected
    await expect(destination.locator('.selected')).toBeVisible()
    await expect(destination).toBeInViewport()
    const submit = picker.getByRole('button', { name: 'Select folder', exact: true })
    await expect(submit).toBeEnabled()
    await submit.click()
    await expect(picker).toBeHidden()
    await expect
      .poll(async () => (await api.getFolder(projectName, second.id)).parentId)
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

  test('find the target folder by searching for all words of any comma separated part', async ({
    page,
    api,
    projectName,
  }) => {
    const sq010 = await api.createFolder(projectName, { name: 'sq010', folderType: 'Sequence' })
    const sq020 = await api.createFolder(projectName, { name: 'sq020', folderType: 'Sequence' })
    await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot', parentId: sq010.id })
    const sh020 = await api.createFolder(projectName, {
      name: 'sh020',
      folderType: 'Shot',
      parentId: sq010.id,
    })
    await api.createFolder(projectName, { name: 'sh030', folderType: 'Shot', parentId: sq020.id })
    const source = await api.createFolder(projectName, { name: 'sh040', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: source.id,
      name: 'comp',
      taskType: 'Compositing',
    })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh040')
    await overview.rowMenu('comp', 'Move')

    await overview.searchMoveDialog('sq010 sh020, sh030')

    const picker = overview.moveDialog()
    await expect(picker.getByText('sh010', { exact: true })).toBeHidden()
    await expect(picker.getByText('sh020', { exact: true })).toBeVisible()
    await expect(picker.getByText('sh030', { exact: true })).toBeVisible()
    await overview.moveTo('sh020')
    await expect.poll(async () => (await api.getTask(projectName, task.id)).folderId).toBe(sh020.id)
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
