import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'

const COLUMNS = ['name', 'attrib_fps', 'attrib_frameStart'].map((name) => ({ name, visible: true }))

// fps ties are broken by frameStart in a different order than by name
const VALUES: [string, number, number][] = [
  ['a', 25, 30],
  ['b', 24, 40],
  ['c', 25, 10],
  ['d', 24, 20],
]

const createShots = async (
  api: AyonApi,
  projectName: string,
  settings: Record<string, unknown> = {},
) => {
  for (const [suffix, fps, frameStart] of VALUES) {
    const folder = await api.createFolder(projectName, { name: `sh_${suffix}`, folderType: 'Shot' })
    await api.updateFolder(projectName, folder.id, { attrib: { fps, frameStart } })
  }
  await api.setWorkingViewSettings('overview', projectName, { columns: COLUMNS, ...settings })
}

const createTasks = async (
  api: AyonApi,
  projectName: string,
  settings: Record<string, unknown> = {},
) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  for (const [suffix, fps, frameStart] of VALUES) {
    const task = await api.createTask(projectName, { folderId: folder.id, name: `t_${suffix}` })
    await api.updateTask(projectName, task.id, { attrib: { fps, frameStart } })
  }
  // without the hierarchy the overview is a flat task list that the server sorts
  await api.setWorkingViewSettings('overview', projectName, {
    showHierarchy: false,
    columns: COLUMNS,
    ...settings,
  })
}

const shots = (order: string) => order.split('').map((suffix) => new RegExp(`sh_${suffix}$`))
const tasks = (order: string) => order.split('').map((suffix) => new RegExp(`t_${suffix}$`))

const savedSort = (api: AyonApi, projectName: string) => async () =>
  (await api.getWorkingViewSettings('overview', projectName))?.sortBy

test.describe('overview multi-key sorting from the headers', () => {
  test('shift+click adds a column as the next sort key, flips it and removes it', async ({
    page,
    api,
    projectName,
  }) => {
    await createShots(api, projectName)
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.toggleSort('attrib_fps')
    await expect(overview.nameCells()).toHaveText(shots('bdac'))
    await expect(overview.sortIndex('attrib_fps')).toBeHidden()

    await overview.toggleSort('attrib_frameStart', { shift: true })
    await expect(overview.nameCells()).toHaveText(shots('dbca'))
    await expect(overview.sortIndex('attrib_fps')).toHaveText('1')
    await expect(overview.sortIndex('attrib_frameStart')).toHaveText('2')
    await expect.poll(savedSort(api, projectName)).toEqual(['attrib_fps', 'attrib_frameStart'])

    await overview.toggleSort('attrib_frameStart', { shift: true })
    await expect(overview.nameCells()).toHaveText(shots('bdac'))
    await expect.poll(savedSort(api, projectName)).toEqual(['attrib_fps', '-attrib_frameStart'])

    await overview.toggleSort('attrib_frameStart', { shift: true })
    await expect(overview.sortIndex('attrib_fps')).toBeHidden()
    await expect.poll(savedSort(api, projectName)).toEqual(['attrib_fps'])
  })

  test('a multi-key sort is kept after a reload', async ({ page, api, projectName }) => {
    await createShots(api, projectName)
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.toggleSort('attrib_fps')
    await overview.toggleSort('attrib_frameStart', { shift: true })
    await expect.poll(savedSort(api, projectName)).toEqual(['attrib_fps', 'attrib_frameStart'])

    await overview.goto(projectName)

    await expect(overview.nameCells()).toHaveText(shots('dbca'))
    await expect(overview.sortIndex('attrib_fps')).toHaveText('1')
    await expect(overview.sortIndex('attrib_frameStart')).toHaveText('2')
  })

  test('a plain click sorts by that column only', async ({ page, api, projectName }) => {
    await createShots(api, projectName, { sortBy: ['attrib_fps', 'attrib_frameStart'] })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await expect(overview.nameCells()).toHaveText(shots('dbca'))

    await overview.toggleSort('attrib_fps')

    await expect(overview.nameCells()).toHaveText(shots('cadb'))
    await expect(overview.sortIndex('attrib_fps')).toBeHidden()
    await expect.poll(savedSort(api, projectName)).toEqual(['-attrib_fps'])
  })

  test('"Add to sort" in a column menu adds the column as the next sort key', async ({
    page,
    api,
    projectName,
  }) => {
    await createShots(api, projectName, { sortBy: ['attrib_fps'] })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await expect(overview.nameCells()).toHaveText(shots('bdac'))

    await overview.columnMenu('attrib_frameStart', 'Add to sort')

    await expect(overview.nameCells()).toHaveText(shots('dbca'))
    await expect.poll(savedSort(api, projectName)).toEqual(['attrib_fps', 'attrib_frameStart'])
  })

  test('a view saved with a single sortBy and sortDesc loads and can be extended', async ({
    page,
    api,
    projectName,
  }) => {
    await createShots(api, projectName, { sortBy: 'attrib_fps', sortDesc: true })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await expect(overview.nameCells()).toHaveText(shots('cadb'))

    await overview.toggleSort('attrib_frameStart', { shift: true })
    await overview.toggleSort('attrib_frameStart', { shift: true })

    await expect(overview.nameCells()).toHaveText(shots('acbd'))
    await expect.poll(savedSort(api, projectName)).toEqual(['-attrib_fps', '-attrib_frameStart'])
  })
})

test.describe('overview sort settings', () => {
  test('add, flip and remove sort keys', async ({ page, api, projectName }) => {
    await createShots(api, projectName)
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.openSortSettings()

    await overview.addSortKey('attrib_fps')
    await expect(overview.nameCells()).toHaveText(shots('bdac'))

    await overview.addSortKey('attrib_frameStart')
    await expect(overview.nameCells()).toHaveText(shots('dbca'))
    expect(await overview.sortKeyIds()).toEqual(['attrib_fps', 'attrib_frameStart'])
    await expect.poll(savedSort(api, projectName)).toEqual(['attrib_fps', 'attrib_frameStart'])

    await overview.flipSortKey('attrib_fps')
    await expect(overview.nameCells()).toHaveText(shots('cadb'))
    await expect.poll(savedSort(api, projectName)).toEqual(['-attrib_fps', 'attrib_frameStart'])

    await overview.removeSortKey('attrib_fps')
    await expect(overview.nameCells()).toHaveText(shots('cdab'))
    await expect.poll(savedSort(api, projectName)).toEqual(['attrib_frameStart'])
  })

  test('dragging a sort key changes the order of precedence', async ({
    page,
    api,
    projectName,
  }) => {
    await createShots(api, projectName, { sortBy: ['attrib_fps', 'attrib_frameStart'] })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await expect(overview.nameCells()).toHaveText(shots('dbca'))
    await overview.openSortSettings()
    expect(await overview.sortKeyIds()).toEqual(['attrib_fps', 'attrib_frameStart'])

    await overview.dragSortKey('attrib_frameStart', 'attrib_fps')

    await expect.poll(() => overview.sortKeyIds()).toEqual(['attrib_frameStart', 'attrib_fps'])
    await expect(overview.nameCells()).toHaveText(shots('cdab'))
    await expect.poll(savedSort(api, projectName)).toEqual(['attrib_frameStart', 'attrib_fps'])
  })

  test('the settings follow a sort made from the headers', async ({ page, api, projectName }) => {
    await createShots(api, projectName)
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.toggleSort('attrib_fps')
    await overview.toggleSort('attrib_frameStart', { shift: true })
    await overview.toggleSort('attrib_frameStart', { shift: true })

    await overview.openSortSettings()

    expect(await overview.sortKeyIds()).toEqual(['attrib_fps', 'attrib_frameStart'])
    await expect(
      overview.sortKey('attrib_fps').getByRole('button', { name: 'arrow_upward', exact: true }),
    ).toBeVisible()
    await expect(
      overview
        .sortKey('attrib_frameStart')
        .getByRole('button', { name: 'arrow_downward', exact: true }),
    ).toBeVisible()
  })
})

test.describe('overview multi-key sorting on the server', () => {
  const directions: [string, string[], string][] = [
    ['both ascending', ['attrib_fps', 'attrib_frameStart'], 'dbca'],
    ['ascending then descending', ['attrib_fps', '-attrib_frameStart'], 'bdac'],
    ['descending then ascending', ['-attrib_fps', 'attrib_frameStart'], 'cadb'],
    ['both descending', ['-attrib_fps', '-attrib_frameStart'], 'acbd'],
  ]

  for (const [title, sortBy, order] of directions) {
    test(`the flat task list is sorted by two keys, ${title}`, async ({
      page,
      api,
      projectName,
    }) => {
      await createTasks(api, projectName, { sortBy })
      const overview = new OverviewPage(page)

      await overview.goto(projectName)

      await expect(overview.nameCells()).toHaveText(tasks(order))
    })
  }

  test('adding a sort key from a header re-sorts the flat task list', async ({
    page,
    api,
    projectName,
  }) => {
    await createTasks(api, projectName, { sortBy: ['-attrib_fps'] })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await expect(overview.nameCells()).toHaveText([/t_[ac]$/, /t_[ac]$/, /t_[bd]$/, /t_[bd]$/])

    await overview.toggleSort('attrib_frameStart', { shift: true })

    await expect(overview.nameCells()).toHaveText(tasks('cadb'))
    await expect.poll(savedSort(api, projectName)).toEqual(['-attrib_fps', 'attrib_frameStart'])
  })
})
