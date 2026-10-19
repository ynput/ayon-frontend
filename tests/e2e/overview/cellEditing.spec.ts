import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'

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
    await api.setWorkingViewColumns('overview', projectName, ['name', 'attrib_fps'])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')
    await expect(overview.cell('anim', 'attrib_fps')).toHaveText('25')

    await overview.editTextCell('sh010', 'attrib_fps', '48')

    await expect(overview.cell('sh010', 'attrib_fps')).toHaveText('48')
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
    await page.keyboard.press('Escape')
    await expect(page.locator('.options')).toBeHidden()

    await expect(overview.cell('anim', 'tags')).toContainText('hero')
    await expect
      .poll(async () => (await api.getTask(projectName, tasks[0].id)).tags)
      .toEqual(['hero'])
  })

  test('add a new tag to a task when the project anatomy has no tags', async ({
    page,
    api,
    projectName,
  }) => {
    await api.patch(`/api/projects/${projectName}`, { tags: [] })
    const { tasks } = await createShot(api, projectName, ['anim'])
    await api.setWorkingViewColumns('overview', projectName, ['name', 'tags'])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')

    await overview.cell('anim', 'tags').dblclick()
    const search = page.locator('.search').getByRole('textbox')
    await search.click()
    await expect(search).toBeFocused()
    await search.fill('adhoc')
    await search.press('Enter')
    await page.keyboard.press('Escape')
    await expect(page.locator('.options')).toBeHidden()

    await expect(overview.cell('anim', 'tags')).toContainText('adhoc')
    await expect
      .poll(async () => (await api.getTask(projectName, tasks[0].id)).tags)
      .toEqual(['adhoc'])
  })

  // closing the dropdown by clicking another cell must save to the edited task, wherever the click lands
  const closeTargets = [
    { name: 'the name of the same row', label: 'anim', columnId: 'name' },
    { name: 'an attribute of the same row', label: 'anim', columnId: 'attrib_fps' },
    { name: 'the name of another row', label: 'comp', columnId: 'name' },
    { name: 'the tags of another row', label: 'comp', columnId: 'tags' },
  ]
  for (const target of closeTargets) {
    test(`replace the tags of a task, closing by clicking ${target.name}`, async ({
      page,
      api,
      projectName,
    }) => {
      await api.patch(`/api/projects/${projectName}`, {
        tags: [
          { name: 'hero', color: '#ff2450' },
          { name: 'rush', color: '#5be1c6' },
        ],
      })
      const { tasks } = await createShot(api, projectName, ['anim', 'comp'])
      await api.patch(`/api/projects/${projectName}/tasks/${tasks[0].id}`, { tags: ['hero'] })
      await api.setWorkingViewColumns('overview', projectName, ['name', 'tags', 'attrib_fps'])
      const overview = new OverviewPage(page)
      await overview.goto(projectName)
      await overview.expand('sh010')
      await expect(overview.cell('anim', 'tags')).toContainText('hero')

      await overview.toggleEnumCellValues(
        'anim',
        'tags',
        ['rush', 'hero'],
        overview.cell(target.label, target.columnId),
      )

      await expect(overview.cell('anim', 'tags')).toContainText('rush')
      await expect(overview.cell('anim', 'tags')).not.toContainText('hero')
      await expect
        .poll(async () => (await api.getTask(projectName, tasks[0].id)).tags)
        .toEqual(['rush'])
      expect((await api.getTask(projectName, tasks[1].id)).tags).toEqual([])
    })
  }

  test('reassign a task', async ({ page, api, projectName, createUser, accessGroup }) => {
    const accessGroups = { [projectName]: [accessGroup] }
    const first = await createUser({ licensed: true, accessGroups })
    const second = await createUser({ licensed: true, accessGroups })
    const { tasks } = await createShot(api, projectName, ['anim'])
    await api.patch(`/api/projects/${projectName}/tasks/${tasks[0].id}`, {
      assignees: [first.name],
    })
    await api.setWorkingViewColumns('overview', projectName, ['name', 'assignees'])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')
    await expect(overview.cell('anim', 'assignees')).toContainText(first.name)

    await overview.toggleEnumCellValues('anim', 'assignees', [second.name, first.name])

    await expect(overview.cell('anim', 'assignees')).toContainText(second.name)
    await expect(overview.cell('anim', 'assignees')).not.toContainText(first.name)
    await expect
      .poll(async () => (await api.getTask(projectName, tasks[0].id)).assignees)
      .toEqual([second.name])
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
