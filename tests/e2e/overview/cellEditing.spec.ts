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
