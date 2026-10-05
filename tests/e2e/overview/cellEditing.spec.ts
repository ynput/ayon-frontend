import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'

/** A shot with the given tasks */
const createShot = async (api: AyonApi, projectName: string, tasks: string[]) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const created = []
  for (const name of tasks) {
    created.push(
      await api.createTask(projectName, { folderId: folder.id, name, taskType: 'Generic' }),
    )
  }
  return { folder, tasks: created }
}

test.describe('overview cell editing', () => {
  test('change a task priority', async ({ page, api, projectName }) => {
    const { tasks } = await createShot(api, projectName, ['anim'])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')

    await overview.setEnumCell('anim', 'attrib_priority', 'high')

    await expect(overview.cell('anim', 'attrib_priority')).toContainText('High')
    await expect
      .poll(async () => (await api.getTask(projectName, tasks[0].id)).attrib.priority)
      .toBe('high')
  })

  test('change the status of several selected tasks at once', async ({
    page,
    api,
    projectName,
  }) => {
    const { tasks } = await createShot(api, projectName, ['anim', 'comp', 'light', 'roto'])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')

    // select the status cells of the first three tasks (in name order) and change them together
    await overview.clickCell('anim', 'status')
    await overview.clickCell('light', 'status', { shift: true })
    await expect(overview.cell('comp', 'status')).toHaveClass(/selected/)
    await overview.pickForSelectedCells('Approved')

    for (const name of ['anim', 'comp', 'light']) {
      await expect(overview.cell(name, 'status')).toContainText('Approved')
    }
    await expect(overview.cell('roto', 'status')).toContainText('Not ready')
    await expect
      .poll(async () =>
        Object.fromEntries(
          (await api.listTasks(projectName, tasks[0].folderId)).map((t) => [t.name, t.status]),
        ),
      )
      .toEqual({ anim: 'Approved', comp: 'Approved', light: 'Approved', roto: 'Not ready' })
  })

  test('undo and redo a status change', async ({ page, api, projectName }) => {
    const { tasks } = await createShot(api, projectName, ['anim'])
    const status = async () => (await api.getTask(projectName, tasks[0].id)).status
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')
    await overview.setEnumCell('anim', 'status', 'In progress')
    await expect.poll(status).toBe('In progress')

    await overview.undo()

    await expect(overview.cell('anim', 'status')).toContainText('Not ready')
    await expect.poll(status).toBe('Not ready')

    await overview.redo()

    await expect(overview.cell('anim', 'status')).toContainText('In progress')
    await expect.poll(status).toBe('In progress')
  })

  test('tasks inherit an attribute edited on their folder', async ({ page, api, projectName }) => {
    const { folder, tasks } = await createShot(api, projectName, ['anim'])
    // show the FPS column (the default view hides most attributes)
    await api.setWorkingViewColumns('overview', projectName, ['name', 'attrib_fps'])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')
    await expect(overview.cell('anim', 'attrib_fps')).toHaveText('25')

    await overview.editTextCell('sh010', 'attrib_fps', '48')

    await expect(overview.cell('sh010', 'attrib_fps')).toHaveText('48')
    // inherited values are shown, but greyed out
    await expect(overview.cell('anim', 'attrib_fps')).toHaveText('48')
    await expect(overview.cell('anim', 'attrib_fps').locator('.inherited')).toBeVisible()
    await expect.poll(async () => (await api.getFolder(projectName, folder.id)).attrib.fps).toBe(48)
    await expect
      .poll(async () => {
        const { attrib, ownAttrib } = await api.getTask(projectName, tasks[0].id)
        return { fps: attrib.fps, own: ownAttrib.includes('fps') }
      })
      .toEqual({ fps: 48, own: false })
  })

  test('delete a task', async ({ page, api, projectName }) => {
    const { folder, tasks } = await createShot(api, projectName, ['keep', 'remove'])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')

    await overview.deleteRow('remove')

    await expect(overview.row('remove')).toBeHidden()
    await expect(overview.row('keep')).toBeVisible()
    await expect
      .poll(async () => (await api.listTasks(projectName, folder.id)).map((t) => t.id))
      .toEqual([tasks[0].id])
  })
})

test.describe('overview tag and date cells', () => {
  test('add a tag to a task', async ({ page, api, projectName }) => {
    // the tags offered are the project's tags
    await api.patch(`/api/projects/${projectName}`, {
      tags: [
        { name: 'hero', color: '#ff2450' },
        { name: 'rush', color: '#5be1c6' },
      ],
    })
    const { tasks } = await createShot(api, projectName, ['anim'])
    await api.setWorkingViewColumns('overview', projectName, ['name', 'tags'])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')

    await overview.setEnumCell('anim', 'tags', 'hero')
    // tags are a multi select, the dropdown stays open until it is closed
    await page.keyboard.press('Escape')
    await expect(page.locator('.options')).toBeHidden()

    await expect(overview.cell('anim', 'tags')).toContainText('hero')
    await expect
      .poll(async () => (await api.getTask(projectName, tasks[0].id)).tags)
      .toEqual(['hero'])
  })

  test('set a date attribute', async ({ page, api, projectName }) => {
    const { tasks } = await createShot(api, projectName, ['anim'])
    await api.setWorkingViewColumns('overview', projectName, ['name', 'attrib_startDate'])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')

    await overview.setDateCell('anim', 'attrib_startDate', '2026-11-15')

    await expect(overview.cell('anim', 'attrib_startDate')).toHaveText('15-11-2026')
    await expect
      .poll(async () => (await api.getTask(projectName, tasks[0].id)).attrib.startDate)
      .toBe('2026-11-15T00:00:00+00:00')
  })
})
