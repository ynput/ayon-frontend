import { expect, test } from '../fixtures'
import { ExportDialog, expectTableHeaders, exportFileName, pick } from '../pages/ExportDialog'
import { ListsPage } from '../pages/ListsPage'
import { AyonApi } from '../support/api'
import { requireTableExport } from './requireTableExport'

const COLUMNS = ['name', 'attrib_fps'].map((name) => ({ name, visible: true }))

/** A task list whose item order differs from the task names and from their fps */
const seedTaskList = async (api: AyonApi, projectName: string) => {
  const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const listId = await api.createEntityList(projectName, { label: 'Client picks' })
  for (const [name, fps] of [
    ['t_c', 24],
    ['t_a', 30],
    ['t_b', 25],
  ] as const) {
    const task = await api.createTask(projectName, { folderId: shot.id, name })
    await api.updateTask(projectName, task.id, { attrib: { fps } })
    await api.addEntityListItem(projectName, listId, task.id)
  }
}

const names = (rows: string[][]) => rows.slice(1).map((row) => row[0])

test.describe('lists table export', () => {
  test.beforeEach(async ({ api }) => {
    await requireTableExport(api)
  })

  test('a list exports its items in list order', async ({ page, api, projectName }) => {
    await seedTaskList(api, projectName)
    await api.setWorkingViewSettings('lists', projectName, { columns: COLUMNS })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Client picks')
    await expect(lists.itemNameCells()).toHaveText([/t_c$/, /t_a$/, /t_b$/])
    const exportDialog = new ExportDialog(page)

    await exportDialog.openFromToolbar()
    await exportDialog.choose('CSV', 'Raw')
    const file = await exportDialog.export()

    expect(file.fileName).toBe(exportFileName(projectName, 'table', 'csv'))
    expect(names(file.rows)).toEqual(['t_c', 't_a', 't_b'])
    expect(pick(file, ['attrib.fps']).slice(1)).toEqual([['24.0'], ['30.0'], ['25.0']])
  })

  test('a sorted list exports in the sort order', async ({ page, api, projectName }) => {
    await seedTaskList(api, projectName)
    await api.setWorkingViewSettings('lists', projectName, {
      columns: COLUMNS,
      sortBy: ['-attrib_fps'],
    })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Client picks')
    await expect(lists.itemNameCells()).toHaveText([/t_a$/, /t_b$/, /t_c$/])
    const exportDialog = new ExportDialog(page)

    await exportDialog.openFromToolbar()
    const file = await exportDialog.export()

    await expectTableHeaders(file, lists.itemsTable)
    expect(names(file.rows)).toEqual(['t_a', 't_b', 't_c'])
  })

  test('export the selected list items from the context menu', async ({
    page,
    api,
    projectName,
  }) => {
    await seedTaskList(api, projectName)
    await api.setWorkingViewSettings('lists', projectName, { columns: COLUMNS })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Client picks')
    await lists.clickItemCell('t_b', 'name')
    await lists.itemCell('t_c', 'name').click({ modifiers: ['ControlOrMeta'] })
    await expect(lists.itemsTable.locator('td.name.selected')).toHaveCount(2)
    const exportDialog = new ExportDialog(page)

    await exportDialog.openFromContextMenu(lists.itemCell('t_c', 'name'))
    await expect(exportDialog.option('Selected rows')).toContainText('2 rows')
    const file = await exportDialog.export()

    expect(file.fileName).toBe(exportFileName(projectName, 'selection', 'xlsx'))
    expect(names(file.rows).sort()).toEqual(['t_b', 't_c'])
  })

  test('a review session exports its versions in session order', async ({
    page,
    api,
    projectName,
  }) => {
    const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const product = await api.createProduct(projectName, { folderId: shot.id, name: 'renderMain' })
    const v1 = await api.createVersion(projectName, { productId: product.id, version: 1 })
    const v2 = await api.createVersion(projectName, { productId: product.id, version: 2 })
    const v3 = await api.createVersion(projectName, { productId: product.id, version: 3 })
    const listId = await api.createEntityList(projectName, {
      label: 'Dailies',
      entityType: 'version',
      entityListType: 'review-session',
    })
    for (const version of [v2, v3, v1]) await api.addEntityListItem(projectName, listId, version.id)
    const lists = new ListsPage(page)
    await lists.goto(projectName, 'reviews')
    // the review page may show cards instead of the table, the export reads the session either way
    await lists.listRow('Dailies').click()
    const exportDialog = new ExportDialog(page)

    await exportDialog.openFromToolbar()
    const file = await exportDialog.export()

    expect(names(file.rows)).toEqual(['renderMain v002', 'renderMain v003', 'renderMain v001'])
  })
})
