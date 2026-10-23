import { writeFile } from 'fs/promises'
import { expect, test } from '../fixtures'
import {
  column,
  ExportDialog,
  expectTableHeaders,
  exportFileName,
  pick,
} from '../pages/ExportDialog'
import { OverviewPage } from '../pages/OverviewPage'
import { AyonApi } from '../support/api'
import { requireTableExport } from './requireTableExport'

const COLUMNS = ['name', 'subType', 'status', 'attrib_fps']
const NAME = 'Folder / Task'
const HEADERS = [NAME, 'Type', 'Status', 'FPS']
const ALL_COLUMNS = 'All visible columns, not only the selected ones'

// one root folder, so the tree order does not depend on how root folders are sorted
const createHierarchy = async (api: AyonApi, projectName: string) => {
  const sq = await api.createFolder(projectName, { name: 'sq010', folderType: 'Sequence' })
  await api.updateFolder(projectName, sq.id, { status: 'In progress', attrib: { fps: 24 } })
  await api.createTask(projectName, {
    folderId: sq.id,
    name: 'edit',
    taskType: 'Edit',
    status: 'Not ready',
  })
  const sh = await api.createFolder(projectName, {
    name: 'sh010',
    folderType: 'Shot',
    parentId: sq.id,
  })
  await api.updateFolder(projectName, sh.id, { status: 'Not ready', attrib: { fps: 25 } })
  await api.createTask(projectName, {
    folderId: sh.id,
    name: 'anim',
    taskType: 'Animation',
    status: 'In progress',
  })
  await api.createTask(projectName, {
    folderId: sh.id,
    name: 'comp',
    taskType: 'Compositing',
    status: 'Not ready',
  })
  await api.setWorkingViewColumns('overview', projectName, COLUMNS)
}

test.describe('overview table export', () => {
  test.beforeEach(async ({ api }) => {
    await requireTableExport(api)
  })

  test('export the whole table to Excel with the table columns and labels', async ({
    page,
    api,
    projectName,
  }) => {
    await createHierarchy(api, projectName)
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    const exportDialog = new ExportDialog(page)

    await exportDialog.openFromToolbar()
    await exportDialog.expectChosen('Whole table', 'Excel (.xlsx)', 'Readable')
    await expect(exportDialog.root.getByText(/Not exported: Thumbnail/)).toBeVisible()
    const file = await exportDialog.export()

    expect(file.fileName).toBe(exportFileName(projectName, 'table', 'xlsx'))
    // the table's columns in its order, with its header labels
    await expectTableHeaders(file, overview.table)
    // collapsed folders are exported too, tasks before subfolders
    expect(pick(file, HEADERS)).toEqual([
      HEADERS,
      ['sq010', 'Sequence', 'In progress', '24'],
      ['edit', 'Edit', 'Not ready', '24'],
      ['sh010', 'Shot', 'Not ready', '25'],
      ['anim', 'Animation', 'In progress', '25'],
      ['comp', 'Compositing', 'Not ready', '25'],
    ])
  })

  test('the import settings export a raw CSV with only the columns Import CSV reads', async ({
    page,
    api,
    projectName,
  }) => {
    await createHierarchy(api, projectName)
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    const exportDialog = new ExportDialog(page)

    await exportDialog.openFromToolbar()
    await exportDialog.useImportSettings()
    await exportDialog.expectChosen('CSV', 'Raw')
    await exportDialog.setDelimiter('Semicolon')
    // the table's Folder column would stop the import, so it is left out and the dialog says why
    await expect(exportDialog.root).toContainText("Folder (Import CSV can't read it)")
    const file = await exportDialog.export()

    expect(file.fileName).toBe(exportFileName(projectName, 'table', 'csv'))
    // field names, the import columns first
    expect(file.rows[0].slice(0, 6)).toEqual([
      'entity_type',
      'path',
      'name',
      'folder_or_task_type',
      'status',
      'attrib.fps',
    ])
    expect(file.rows[0]).not.toContain('folder')
    expect(column(file, 'entity_type')).toEqual(['folder', 'task', 'folder', 'task', 'task'])
    expect(column(file, 'path')).toEqual([
      'sq010',
      'sq010/edit',
      'sq010/sh010',
      'sq010/sh010/anim',
      'sq010/sh010/comp',
    ])

    // the dialog remembers the settings
    await exportDialog.openFromToolbar()
    await exportDialog.expectChosen('CSV', 'Raw')
    await expect(exportDialog.toggle('Add entity type and path columns')).toHaveClass(
      /\bselected\b/,
    )
    await page.keyboard.press('Escape')
    await expect(exportDialog.root).toBeHidden()
    await expect(page).not.toHaveURL(/[?&]tableExport=/)
  })

  // FLAG (app bug): Import CSV did not map the values of a combined folder_or_task_type column
  // fixed in ynput/ayon-frontend#2529, switch back to test() once it is merged
  test.fixme(
    'a raw CSV export with the import settings imports into another project',
    async ({ page, api, projectName }, testInfo) => {
      await createHierarchy(api, projectName)
      const overview = new OverviewPage(page)
      await overview.goto(projectName)
      const exportDialog = new ExportDialog(page)
      await exportDialog.openFromToolbar()
      await exportDialog.useImportSettings()
      const file = await exportDialog.export()

      const filePath = testInfo.outputPath(file.fileName)
      await writeFile(filePath, file.data)
      const target = await api.createProject()
      try {
        await overview.goto(target)
        await overview.importCsv(filePath, { created: 5 })

        await expect
          .poll(async () =>
            (await api.listFolders(target)).map((f) => [f.path, f.folderType, f.status]),
          )
          .toEqual([
            ['sq010', 'Sequence', 'In progress'],
            ['sq010/sh010', 'Shot', 'Not ready'],
          ])
        const shot = (await api.listFolders(target)).find((f) => f.name === 'sh010')
        expect(
          (await api.listTasks(target, shot.id)).map((t) => [t.name, t.taskType, t.status]),
        ).toEqual([
          ['anim', 'Animation', 'In progress'],
          ['comp', 'Compositing', 'Not ready'],
        ])
      } finally {
        await page.close()
        await api.deleteProject(target)
      }
    },
  )

  test('a task filter limits the exported rows to what the table shows', async ({
    page,
    api,
    projectName,
  }) => {
    await createHierarchy(api, projectName)
    const other = await api.createFolder(projectName, { name: 'sq020', folderType: 'Sequence' })
    await api.createTask(projectName, { folderId: other.id, name: 'paint', status: 'Not ready' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.addFilter('Task', 'Status', 'In progress')
    await expect(overview.row('sq020')).toBeHidden()
    const exportDialog = new ExportDialog(page)
    await exportDialog.openFromToolbar()
    await exportDialog.choose('CSV')
    const file = await exportDialog.export()

    expect(column(file, NAME).sort()).toEqual(['anim', 'sh010', 'sq010'])
  })

  test('a flat task list exports in the table sort order', async ({ page, api, projectName }) => {
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    // fps ties are broken by frameStart in a different order than the names
    for (const [suffix, fps, frameStart] of [
      ['a', 25, 30],
      ['b', 24, 40],
      ['c', 25, 10],
      ['d', 24, 20],
    ] as const) {
      const task = await api.createTask(projectName, { folderId: folder.id, name: `t_${suffix}` })
      await api.updateTask(projectName, task.id, { attrib: { fps, frameStart } })
    }
    await api.setWorkingViewSettings('overview', projectName, {
      showHierarchy: false,
      columns: ['name', 'attrib_fps', 'attrib_frameStart'].map((name) => ({ name, visible: true })),
      sortBy: ['attrib_fps', '-attrib_frameStart'],
    })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await expect(overview.nameCells()).toHaveText([/t_b$/, /t_d$/, /t_a$/, /t_c$/])

    const exportDialog = new ExportDialog(page)
    await exportDialog.openFromToolbar()
    const file = await exportDialog.export()

    expect(pick(file, [file.rows[0][0], 'FPS', 'Start frame']).slice(1)).toEqual([
      ['t_b', '24', '40'],
      ['t_d', '24', '20'],
      ['t_a', '25', '30'],
      ['t_c', '25', '10'],
    ])
  })

  test('export the selected rows from the context menu, with their or all visible columns', async ({
    page,
    api,
    projectName,
  }) => {
    await createHierarchy(api, projectName)
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sq010')
    await overview.expand('sh010')
    await overview.selectRow('edit')
    await overview.addRowToSelection('anim')
    const exportDialog = new ExportDialog(page)

    await exportDialog.openFromContextMenu(overview.nameCell('anim'))
    await exportDialog.expectChosen('Selected rows')
    await expect(exportDialog.option('Selected rows')).toContainText('2 rows')
    await exportDialog.choose('CSV')
    const selected = await exportDialog.export()

    expect(selected.fileName).toBe(exportFileName(projectName, 'selection', 'csv'))
    expect(selected.rows[0]).toEqual([NAME])
    expect(column(selected, NAME).sort()).toEqual(['anim', 'edit'])

    await exportDialog.openFromContextMenu(overview.nameCell('anim'))
    await exportDialog.setSwitch(ALL_COLUMNS, true)
    const visible = await exportDialog.export()

    await expectTableHeaders(visible, overview.table)
    expect(pick(visible, HEADERS).slice(1).sort()).toEqual([
      ['anim', 'Animation', 'In progress', '25'],
      ['edit', 'Edit', 'Not ready', '24'],
    ])
  })
})
