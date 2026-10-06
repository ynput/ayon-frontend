import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { toast } from '../support/ui'
import { confirmDeleteCounts, OverviewPage } from '../pages/OverviewPage'

const createShot = async (api: AyonApi, projectName: string, tasks: [string, string][]) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const created = []
  for (const [name, status] of tasks) {
    created.push(
      await api.createTask(projectName, { folderId: folder.id, name, taskType: 'Generic', status }),
    )
  }
  return { folder, tasks: created }
}

const createShotsWithFps = async (api: AyonApi, projectName: string, shots: [string, number][]) => {
  const folders = []
  for (const [name, fps] of shots) {
    const folder = await api.createFolder(projectName, { name, folderType: 'Shot' })
    await api.updateFolder(projectName, folder.id, { attrib: { fps } })
    folders.push(folder)
  }
  await api.setWorkingViewColumns('overview', projectName, ['name', 'status', 'attrib_fps'])
  return folders
}

const expectOnlySelected = async (overview: OverviewPage, label: string, columnId: string) => {
  await expect(overview.table.locator('td.selected')).toHaveCount(1)
  await expect(overview.cell(label, columnId)).toHaveClass(/selected/)
}

const tasksBy = async (api: AyonApi, projectName: string, folderId: string, field: string) =>
  Object.fromEntries(
    (await api.listTasks(projectName, folderId)).map((t) => [t.name, t[field]]),
  ) as Record<string, unknown>

test.describe('overview bulk delete', () => {
  test('delete selected folders and tasks together', async ({ page, api, projectName }) => {
    const { folder: shot, tasks } = await createShot(api, projectName, [
      ['anim', 'Not ready'],
      ['comp', 'Not ready'],
      ['fx', 'Not ready'],
    ])
    const keep = await api.createFolder(projectName, { name: 'keep' })
    await api.createFolder(projectName, { name: 'props' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')

    await overview.selectRow('props')
    await overview.addRowToSelection('anim')
    await overview.addRowToSelection('comp')
    await overview.deleteSelected()
    await confirmDeleteCounts(page, /^Delete forever 1 folder and 2 tasks/, { folder: 1, task: 2 })

    await expect(toast(page, '1 folder and 2 tasks deleted')).toBeVisible()
    for (const label of ['props', 'anim', 'comp']) await expect(overview.row(label)).toBeHidden()
    for (const label of ['keep', 'sh010', 'fx']) await expect(overview.row(label)).toBeVisible()
    await expect
      .poll(async () => (await api.listFolders(projectName)).map((f) => f.id).sort())
      .toEqual([keep.id, shot.id].sort())
    await expect
      .poll(async () => (await api.listTasks(projectName, shot.id)).map((t) => t.id))
      .toEqual([tasks[2].id])
  })
})

test.describe('overview copy and paste', () => {
  test.beforeEach(async ({ context }) => {
    // copy and paste use navigator.clipboard; headless Chromium keeps its own clipboard per browser
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  })

  test('paste a copied status into several selected cells', async ({ page, api, projectName }) => {
    const { folder } = await createShot(api, projectName, [
      ['anim', 'In progress'],
      ['comp', 'Not ready'],
      ['fx', 'Not ready'],
      ['roto', 'Not ready'],
    ])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')

    await overview.clickCell('anim', 'status')
    await page.keyboard.press('ControlOrMeta+c')
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('In progress\n')
    await overview.clickCell('comp', 'status')
    await overview.clickCell('fx', 'status', { shift: true })
    await page.keyboard.press('ControlOrMeta+v')

    await expect(overview.cell('comp', 'status')).toContainText('In progress')
    await expect(overview.cell('fx', 'status')).toContainText('In progress')
    await expect(overview.cell('roto', 'status')).toContainText('Not ready')
    await expect
      .poll(() => tasksBy(api, projectName, folder.id, 'status'))
      .toEqual({ anim: 'In progress', comp: 'In progress', fx: 'In progress', roto: 'Not ready' })
  })

  test('paste a block of copied cells into the same columns of other rows', async ({
    page,
    api,
    projectName,
  }) => {
    const { tasks } = await createShot(api, projectName, [
      ['anim', 'Approved'],
      ['comp', 'Not ready'],
      ['fx', 'Not ready'],
    ])
    await api.updateTask(projectName, tasks[0].id, { attrib: { priority: 'urgent' } })
    await api.setWorkingViewColumns('overview', projectName, ['name', 'status', 'attrib_priority'])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')

    await overview.clickCell('anim', 'status')
    await overview.clickCell('anim', 'attrib_priority', { shift: true })
    await page.keyboard.press('ControlOrMeta+c')
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('Approved\turgent\n')
    await overview.clickCell('comp', 'status')
    await overview.clickCell('fx', 'attrib_priority', { shift: true })
    await page.keyboard.press('ControlOrMeta+v')

    for (const name of ['comp', 'fx']) {
      await expect(overview.cell(name, 'status')).toContainText('Approved')
      await expect(overview.cell(name, 'attrib_priority')).toContainText('Urgent')
    }
    await expect
      .poll(async () =>
        (
          await Promise.all(tasks.map((t) => api.getTask(projectName, t.id)))
        ).map((t) => [t.name, t.status, t.attrib.priority]),
      )
      .toEqual([
        ['anim', 'Approved', 'urgent'],
        ['comp', 'Approved', 'urgent'],
        ['fx', 'Approved', 'urgent'],
      ])
  })

  test('paste a number into another number column', async ({ page, api, projectName }) => {
    const first = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const second = await api.createFolder(projectName, { name: 'sh020', folderType: 'Shot' })
    await api.updateFolder(projectName, first.id, { attrib: { frameStart: 1001 } })
    await api.setWorkingViewColumns('overview', projectName, [
      'name',
      'attrib_frameStart',
      'attrib_frameEnd',
    ])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.clickCell('sh010', 'attrib_frameStart')
    await page.keyboard.press('ControlOrMeta+c')
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('1001\n')
    await overview.clickCell('sh010', 'attrib_frameEnd')
    await overview.clickCell('sh020', 'attrib_frameEnd', { shift: true })
    await page.keyboard.press('ControlOrMeta+v')

    await expect(overview.cell('sh010', 'attrib_frameEnd')).toHaveText('1001')
    await expect(overview.cell('sh020', 'attrib_frameEnd')).toHaveText('1001')
    await expect
      .poll(async () =>
        (
          await Promise.all([first, second].map((f) => api.getFolder(projectName, f.id)))
        ).map((f) => f.attrib.frameEnd),
      )
      .toEqual([1001, 1001])
  })
})

test.describe('overview keyboard', () => {
  test('arrow keys move the selected cell between rows', async ({ page, api, projectName }) => {
    await createShotsWithFps(api, projectName, [
      ['sh010', 24],
      ['sh020', 25],
      ['sh030', 30],
    ])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.clickCell('sh010', 'attrib_fps')

    await page.keyboard.press('ArrowDown')
    await expectOnlySelected(overview, 'sh020', 'attrib_fps')
    await page.keyboard.press('ArrowDown')
    await expectOnlySelected(overview, 'sh030', 'attrib_fps')
    await page.keyboard.press('ArrowUp')
    await expectOnlySelected(overview, 'sh020', 'attrib_fps')
    await page.keyboard.press('Shift+ArrowUp')
    await expect(overview.table.locator('td.selected')).toHaveCount(2)
    await expect(overview.cell('sh010', 'attrib_fps')).toHaveClass(/selected/)
  })

  // FLAG (app bug): left/right arrows and Tab also step onto hidden columns
  // fixed in ynput/ayon-frontend#2415, switch back to test() once it is merged
  test.fixme(
    'arrow keys and Tab move to the next shown column',
    async ({ page, api, projectName }) => {
      await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
      const overview = new OverviewPage(page)
      await overview.goto(projectName)
      const shown = await overview.columnIds()
      const next = (columnId: string) => shown[shown.indexOf(columnId) + 1] ?? ''
      await overview.clickCell('sh010', 'status')

      await page.keyboard.press('ArrowRight')
      await expectOnlySelected(overview, 'sh010', next('status'))
      await page.keyboard.press('ArrowLeft')
      await expectOnlySelected(overview, 'sh010', 'status')
      await page.keyboard.press('Tab')
      await expectOnlySelected(overview, 'sh010', next('status'))
      await page.keyboard.press('Shift+Tab')
      await expectOnlySelected(overview, 'sh010', 'status')

      await overview.clickCell('sh010', 'folder_entity')
      await page.keyboard.press('ArrowRight')
      await expectOnlySelected(overview, 'sh010', next('folder_entity'))
    },
  )

  test('Enter edits the selected cell', async ({ page, api, projectName }) => {
    const [shot] = await createShotsWithFps(api, projectName, [
      ['sh010', 24],
      ['sh020', 25],
    ])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.clickCell('sh010', 'attrib_fps')

    await page.keyboard.press('Enter')
    const input = overview.cell('sh010', 'attrib_fps').locator('input')
    await expect(input).toBeFocused()
    await input.fill('30')
    await input.press('Enter')
    await expect(overview.cell('sh020', 'attrib_fps').locator('input')).toBeFocused()
    await page.keyboard.press('Escape')

    await expect(overview.table.locator('td.editing')).toHaveCount(0)
    await expect(overview.cell('sh010', 'attrib_fps')).toHaveText('30')
    await expect.poll(async () => (await api.getFolder(projectName, shot.id)).attrib.fps).toBe(30)
  })

  test('Escape cancels an edit without saving it', async ({ page, api, projectName }) => {
    const [first, second] = await createShotsWithFps(api, projectName, [
      ['sh010', 24],
      ['sh020', 25],
    ])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.clickCell('sh010', 'attrib_fps')
    await page.keyboard.press('Enter')
    const input = overview.cell('sh010', 'attrib_fps').locator('input')
    await input.fill('99')

    await input.press('Escape')

    await expect(input).toBeHidden()
    await expect(overview.cell('sh010', 'attrib_fps')).toHaveText('24')
    await overview.editTextCell('sh020', 'attrib_fps', '50')
    await expect.poll(async () => (await api.getFolder(projectName, second.id)).attrib.fps).toBe(50)
    expect((await api.getFolder(projectName, first.id)).attrib.fps).toBe(24)
  })
})

test.describe('overview sorting', () => {
  const workingView = (api: AyonApi, projectName: string) => async () => {
    const settings = await api.getWorkingViewSettings('overview', projectName)
    return { sortBy: settings?.sortBy, sortDesc: settings?.sortDesc }
  }

  test('sort rows by a column from its header', async ({ page, api, projectName }) => {
    await createShotsWithFps(api, projectName, [
      ['sh_a', 30],
      ['sh_b', 24],
      ['sh_c', 25],
    ])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await expect(overview.nameCells()).toHaveText([/sh_a$/, /sh_b$/, /sh_c$/])

    await overview.toggleSort('attrib_fps')

    await expect(overview.nameCells()).toHaveText([/sh_b$/, /sh_c$/, /sh_a$/])
    await expect
      .poll(workingView(api, projectName))
      .toEqual({ sortBy: 'attrib_fps', sortDesc: false })

    await overview.toggleSort('attrib_fps')

    await expect(overview.nameCells()).toHaveText([/sh_a$/, /sh_c$/, /sh_b$/])
    await expect
      .poll(workingView(api, projectName))
      .toEqual({ sortBy: 'attrib_fps', sortDesc: true })
  })

  test('the sort is kept after a reload', async ({ page, api, projectName }) => {
    await createShotsWithFps(api, projectName, [
      ['sh_a', 30],
      ['sh_b', 24],
      ['sh_c', 25],
    ])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.toggleSort('attrib_fps')
    await expect
      .poll(workingView(api, projectName))
      .toEqual({ sortBy: 'attrib_fps', sortDesc: false })

    await overview.goto(projectName)

    await expect(overview.nameCells()).toHaveText([/sh_b$/, /sh_c$/, /sh_a$/])
  })
})
