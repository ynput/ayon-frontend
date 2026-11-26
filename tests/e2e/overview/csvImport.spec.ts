import path from 'path'
import { expect, test } from '../fixtures'
import { csvFile } from '../pages/ImportDialog'
import { OverviewPage } from '../pages/OverviewPage'
import type { AyonApi } from '../support/api'

const HIERARCHY_CSV = path.join(__dirname, 'fixtures/hierarchy.csv')
// one folder_or_task_type column instead of folder_type and task_type, as a raw table export writes it
const COMBINED_TYPE_CSV = path.join(__dirname, 'fixtures/hierarchyCombinedType.csv')
// numbers and dates are real number and date cells, not text
const HIERARCHY_XLSX = path.join(__dirname, 'fixtures/hierarchy.xlsx')

/** A folder with its attributes, by path */
const getFolderByPath = async (api: AyonApi, project: string, folderPath: string) => {
  const folder = (await api.listFolders(project)).find((f) => f.path === folderPath)
  return folder && api.getFolder(project, folder.id)
}

/** A task with its attributes, by its folder's path and its name */
const getTaskByPath = async (api: AyonApi, project: string, folderPath: string, name: string) => {
  const folder = (await api.listFolders(project)).find((f) => f.path === folderPath)
  const task = folder && (await api.listTasks(project, folder.id)).find((t) => t.name === name)
  return task && api.getTask(project, task.id)
}

const sortedPaths = async (api: AyonApi, project: string) =>
  (await api.listFolders(project)).map((f) => f.path as string).sort()

test.describe('overview import', () => {
  test('import folders and tasks whose columns and values are named as in AYON', async ({
    page,
    api,
    projectName,
    createUser,
  }) => {
    const artist = await createUser({ licensed: true })
    await api.setWorkingViewColumns('overview', projectName, [
      'name',
      'subType',
      'status',
      'tags',
      'assignees',
      'attrib_frameStart',
      'attrib_fps',
      'attrib_startDate',
    ])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    const wizard = await overview.openImport()
    await wizard.importWithDefaults(
      csvFile('shots.csv', [
        // prettier-ignore
        ['path', 'entity_type', 'folder_type', 'task_type', 'status', 'label', 'tags', 'assignees', 'frameStart', 'frameEnd', 'fps', 'startDate', 'endDate', 'description'],
        // prettier-ignore
        ['sq100', 'folder', 'Sequence', '', 'Not ready', 'Sequence 100', '', '', '', '', 24, '', '', ''],
        // prettier-ignore
        ['sq100/sh110', 'folder', 'Shot', '', 'In progress', 'Opening shot', 'important', '', 1001, 1120, 23.976, '2026-03-02', '2026-03-20', 'Hero walks in, rain'],
        // prettier-ignore
        ['sq100/sh110/layout', 'task', '', 'Layout', 'Approved', 'Layout pass', '', artist.name, '', '', '', '2026-03-02', '2026-03-06', ''],
      ]),
      { created: 3 },
    )

    await expect.poll(() => sortedPaths(api, projectName)).toEqual(['sq100', 'sq100/sh110'])
    const sequence = await getFolderByPath(api, projectName, 'sq100')
    expect(sequence).toMatchObject({
      folderType: 'Sequence',
      status: 'Not ready',
      label: 'Sequence 100',
      attrib: { fps: 24 },
    })
    const shot = await getFolderByPath(api, projectName, 'sq100/sh110')
    expect(shot).toMatchObject({
      folderType: 'Shot',
      status: 'In progress',
      label: 'Opening shot',
      tags: ['important'],
      attrib: { frameStart: 1001, frameEnd: 1120, fps: 23.976, description: 'Hero walks in, rain' },
    })
    expect(shot.attrib.startDate).toMatch(/^2026-03-02T00:00:00/)
    expect(shot.attrib.endDate).toMatch(/^2026-03-20T00:00:00/)
    const layout = await getTaskByPath(api, projectName, 'sq100/sh110', 'layout')
    expect(layout).toMatchObject({
      taskType: 'Layout',
      status: 'Approved',
      label: 'Layout pass',
      assignees: [artist.name],
    })
    expect(layout.attrib.startDate).toMatch(/^2026-03-02T00:00:00/)

    await overview.expand('Sequence 100')
    await overview.expand('Opening shot')
    await expect(overview.cell('Opening shot', 'subType')).toContainText('Shot')
    await expect(overview.cell('Opening shot', 'status')).toContainText('In progress')
    await expect(overview.cell('Opening shot', 'tags')).toContainText('important')
    await expect(overview.cell('Opening shot', 'attrib_frameStart')).toHaveText('1001')
    await expect(overview.cell('Opening shot', 'attrib_fps')).toHaveText('23.976')
    await expect(overview.cell('Opening shot', 'attrib_startDate')).toHaveText('2 Mar 2026')
    await expect(overview.cell('Layout pass', 'status')).toContainText('Approved')
    await expect(overview.cell('Layout pass', 'assignees')).toContainText(artist.name)
  })

  test('map columns and values the wizard cannot match by itself', async ({
    page,
    api,
    projectName,
  }) => {
    await api.setWorkingViewColumns('overview', projectName, [
      'name',
      'subType',
      'status',
      'attrib_frameStart',
    ])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    const wizard = await overview.openImport()
    await wizard.upload(
      // the folder type column keeps its AYON name: under any other name its values can't be
      // reviewed (see 'review the values of a folder type column with its own name')
      csvFile('edit_list.csv', [
        [
          'Shot',
          'Kind',
          'folder_type',
          'Department',
          'State',
          'First Frame',
          'Last Frame',
          'Vendor',
        ],
        ['seq010', 'Folder', 'Seq', '', 'WIP', '', '', 'Acme VFX'],
        ['seq010/sh010', 'Folder', 'SHOT', '', 'WIP', 1001, 1100, 'Acme VFX'],
        ['seq010/sh020', 'Folder', 'shot', '', 'Done', 1001, 1050, 'Acme VFX'],
        ['seq010/sh030', 'Folder', 'Previz', '', 'TBD', 1001, 1080, 'Acme VFX'],
        ['seq010/sh010/comp', 'Task', '', 'comp', 'WIP', '', '', 'Acme VFX'],
      ]),
    )
    await wizard.mapColumn('Shot', 'Path')
    await wizard.mapColumn('Kind', 'Entity type')
    await wizard.mapColumn('Department', 'Task type')
    await wizard.mapColumn('State', 'Status')
    await wizard.mapColumn('First Frame', 'Start frame')
    await wizard.mapColumn('Last Frame', 'End frame')
    await wizard.skipColumn('Vendor')
    await wizard.continueToValues()
    // "SHOT" and "shot" match the Shot folder type by themselves
    await wizard.mapValue('Folder type', 'Seq', 'Sequence')
    await wizard.createValue('Folder type', 'Previz')
    await wizard.mapValue('Task type', 'comp', 'Compositing')
    await wizard.mapValue('Status', 'WIP', 'In progress')
    await wizard.mapValue('Status', 'Done', 'Approved')
    await wizard.skipValue('Status', 'TBD')
    await wizard.continueToPreview({ created: 5, skipped: 0, errors: 0 })
    await wizard.importData({ created: 5, skipped: 0, errors: 0 })
    await wizard.close()

    await expect
      .poll(async () =>
        (await api.listFolders(projectName))
          .map((f) => [f.path, f.folderType, f.status])
          .sort((a, b) => a[0].localeCompare(b[0])),
      )
      .toEqual([
        ['seq010', 'Sequence', 'In progress'],
        ['seq010/sh010', 'Shot', 'In progress'],
        ['seq010/sh020', 'Shot', 'Approved'],
        // TBD was skipped, so the shot has the first status
        ['seq010/sh030', 'Previz', 'Not ready'],
      ])
    expect(await getFolderByPath(api, projectName, 'seq010/sh020')).toMatchObject({
      attrib: { frameStart: 1001, frameEnd: 1050 },
    })
    const folderTypes = (await api.getProjectAnatomy(projectName)).folder_types
    expect(folderTypes.map((t: { name: string }) => t.name)).toContain('Previz')
    expect(await getTaskByPath(api, projectName, 'seq010/sh010', 'comp')).toMatchObject({
      taskType: 'Compositing',
      status: 'In progress',
    })

    await overview.expand('seq010')
    await overview.expand('sh010')
    await expect(overview.cell('sh030', 'subType')).toContainText('Previz')
    await expect(overview.cell('sh030', 'status')).toContainText('Not ready')
    await expect(overview.cell('sh020', 'status')).toContainText('Approved')
    await expect(overview.cell('sh020', 'attrib_frameStart')).toHaveText('1001')
    await expect(overview.cell('comp', 'subType')).toContainText('Compositing')
  })

  // FLAG (app bug): getHierarchyRowFilter (src/containers/ImportDialog/steps/hierarchy.ts) switches on the file column's name, not its target, so a Folder type column not named "folder_type" lists only the task rows' values
  test.fixme(
    'review the values of a folder type column with its own name',
    async ({ page, api, projectName }) => {
      await api.setWorkingViewColumns('overview', projectName, ['name', 'subType'])
      const overview = new OverviewPage(page)
      await overview.goto(projectName)

      const wizard = await overview.openImport()
      await wizard.upload(
        csvFile('types.csv', [
          ['path', 'entity_type', 'Type'],
          ['seq010', 'folder', 'Seq'],
          ['seq010/sh010', 'folder', 'Shot'],
        ]),
      )
      await wizard.mapColumn('Type', 'Folder type')
      await wizard.continueToValues()
      await wizard.mapValue('Folder type', 'Seq', 'Sequence')
      await wizard.continueToPreview({ created: 2, errors: 0 })
      await wizard.importData({ created: 2, errors: 0 })
      await wizard.close()

      await expect
        .poll(async () =>
          (await api.listFolders(projectName)).map((f) => [f.path, f.folderType]).sort(),
        )
        .toEqual([
          ['seq010', 'Sequence'],
          ['seq010/sh010', 'Shot'],
        ])
      await expect(overview.cell('seq010', 'subType')).toContainText('Sequence')
    },
  )

  // FLAG (app bug): the preview already creates the folder type (ayon-backend import_data.py _validate_enum_value calls EnumRegistry.create_item in preview too), so it stays after the wizard is closed
  test.fixme(
    'a folder type created from a value waits for the import',
    async ({ page, api, projectName }) => {
      const overview = new OverviewPage(page)
      await overview.goto(projectName)

      const wizard = await overview.openImport()
      await wizard.upload(
        csvFile('previz.csv', [
          ['path', 'entity_type', 'folder_type'],
          ['pv010', 'folder', 'Previz'],
        ]),
      )
      await wizard.continueToValues()
      await wizard.createValue('Folder type', 'Previz')
      await wizard.continueToPreview({ created: 1, errors: 0 })
      await wizard.dismiss()

      const folderTypes = (await api.getProjectAnatomy(projectName)).folder_types
      expect(folderTypes.map((t: { name: string }) => t.name)).not.toContain('Previz')
      expect(await api.listFolders(projectName)).toEqual([])
    },
  )

  // FLAG (app bug): the server creates a new folder type once per row, so the preview's second row fails with 'duplicate key value violates unique constraint "folder_types_pkey"'
  test.fixme(
    'rows that share a new folder type create it once',
    async ({ page, api, projectName }) => {
      await api.setWorkingViewColumns('overview', projectName, ['name', 'subType'])
      const overview = new OverviewPage(page)
      await overview.goto(projectName)

      const wizard = await overview.openImport()
      await wizard.upload(
        csvFile('previz.csv', [
          ['path', 'entity_type', 'folder_type'],
          ['pv010', 'folder', 'Previz'],
          ['pv020', 'folder', 'Previz'],
        ]),
      )
      await wizard.continueToValues()
      await wizard.createValue('Folder type', 'Previz')
      await wizard.continueToPreview({ created: 2, errors: 0 })
      await wizard.importData({ created: 2, errors: 0 })
      await wizard.close()

      await expect
        .poll(async () =>
          (await api.listFolders(projectName)).map((f) => [f.path, f.folderType]).sort(),
        )
        .toEqual([
          ['pv010', 'Previz'],
          ['pv020', 'Previz'],
        ])
      await expect(overview.cell('pv020', 'subType')).toContainText('Previz')
    },
  )

  test('update only skips rows that match nothing or change nothing', async ({
    page,
    api,
    projectName,
  }) => {
    const sequence = await api.createFolder(projectName, { name: 'sq010', folderType: 'Sequence' })
    for (const name of ['sh010', 'sh020']) {
      await api.createFolder(projectName, { name, folderType: 'Shot', parentId: sequence.id })
    }
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    const wizard = await overview.openImport()
    await wizard.upload(
      csvFile('labels.csv', [
        ['path', 'label'],
        ['sq010/sh010', 'Hero shot'],
        ['sq010/sh020', ''],
        ['sq010/sh999', 'Ghost shot'],
        ['sq020', 'Ghost sequence'],
      ]),
    )
    await wizard.setImportMode('Update only')
    await wizard.continueToValues()
    await wizard.continueToPreview({ created: 0, updated: 1, skipped: 3, errors: 0 })
    const reasons = {
      2: 'Nothing to update',
      3: "No folder or task with path 'sq010/sh999'",
      4: "No folder or task with path 'sq020'",
    }
    await wizard.expectRowReasons('skipped', reasons, false)
    await wizard.importData({ created: 0, updated: 1, skipped: 3, errors: 0 })
    await wizard.expectRowReasons('skipped', reasons, true)
    await wizard.close()

    await expect
      .poll(async () => (await getFolderByPath(api, projectName, 'sq010/sh010'))?.label)
      .toBe('Hero shot')
    expect((await getFolderByPath(api, projectName, 'sq010/sh020')).label).toBeFalsy()
    expect(await sortedPaths(api, projectName)).toEqual(['sq010', 'sq010/sh010', 'sq010/sh020'])

    await overview.expand('sq010')
    await expect(overview.row('Hero shot')).toBeVisible()
    await expect(overview.row('sh020')).toBeVisible()
    await expect(overview.row('Ghost shot')).toHaveCount(0)
    await expect(overview.row('Ghost sequence')).toHaveCount(0)
  })

  test('update existing folders and tasks and keep what the file leaves out', async ({
    page,
    api,
    projectName,
    createUser,
  }) => {
    const alice = await createUser({ licensed: true })
    const bob = await createUser({ licensed: true })
    const sequence = await api.createFolder(projectName, { name: 'sq010', folderType: 'Sequence' })
    const shot = await api.createFolder(projectName, {
      name: 'sh010',
      folderType: 'Shot',
      parentId: sequence.id,
      status: 'Not ready',
      attrib: { frameStart: 1001, frameEnd: 1100, fps: 25, description: 'Opening' },
    })
    await api.createTask(projectName, {
      folderId: shot.id,
      name: 'anim',
      label: 'Blocking',
      taskType: 'Animation',
      assignees: [alice.name],
    })
    await api.setWorkingViewColumns('overview', projectName, [
      'name',
      'status',
      'assignees',
      'attrib_frameEnd',
    ])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    const wizard = await overview.openImport()
    await wizard.importWithDefaults(
      csvFile('retakes.csv', [
        ['path', 'entity_type', 'status', 'label', 'frameEnd', 'assignees'],
        ['sq010/sh010', 'folder', 'In progress', 'Hero shot', 1240, ''],
        ['sq010/sh010/anim', 'task', 'Pending review', '', '', bob.name],
      ]),
      { created: 0, updated: 2, skipped: 0, errors: 0 },
    )

    await expect
      .poll(async () => (await api.getFolder(projectName, shot.id)).status)
      .toBe('In progress')
    expect(await api.getFolder(projectName, shot.id)).toMatchObject({
      label: 'Hero shot',
      folderType: 'Shot',
      attrib: { frameStart: 1001, frameEnd: 1240, fps: 25, description: 'Opening' },
    })
    expect(await getTaskByPath(api, projectName, 'sq010/sh010', 'anim')).toMatchObject({
      status: 'Pending review',
      label: 'Blocking',
      taskType: 'Animation',
      assignees: [bob.name],
    })
    expect(await sortedPaths(api, projectName)).toEqual(['sq010', 'sq010/sh010'])

    await overview.expand('sq010')
    await overview.expand('Hero shot')
    await expect(overview.cell('Hero shot', 'status')).toContainText('In progress')
    await expect(overview.cell('Hero shot', 'attrib_frameEnd')).toHaveText('1240')
    await expect(overview.cell('Blocking', 'status')).toContainText('Pending review')
    await expect(overview.cell('Blocking', 'assignees')).toContainText(bob.name)
    await expect(overview.cell('Blocking', 'assignees')).not.toContainText(alice.name)
  })

  test('update all folders a name matches only when asked to', async ({
    page,
    api,
    projectName,
  }) => {
    const shotIds: string[] = []
    for (const name of ['sq010', 'sq020']) {
      const sequence = await api.createFolder(projectName, { name, folderType: 'Sequence' })
      const shot = await api.createFolder(projectName, {
        name: 'sh010',
        folderType: 'Shot',
        parentId: sequence.id,
        status: 'In progress',
      })
      shotIds.push(shot.id)
    }
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    const file = csvFile('approvals.csv', [
      ['name', 'status'],
      ['sh010', 'Approved'],
    ])

    // "Skip the row" is the default
    let wizard = await overview.openImport()
    await wizard.upload(file)
    await wizard.setImportMode('Update only')
    await wizard.continueToValues()
    await wizard.continueToPreview({ updated: 0, errors: 1 })
    const reasons = {
      1: "Name 'sh010' matches 2 folders, map a Path column to pick one or choose to update all matches",
    }
    await wizard.expectRowReasons('errors', reasons, false)
    await wizard.importData({ updated: 0, errors: 1 })
    await wizard.expectRowReasons('errors', reasons, true)
    await wizard.close()
    for (const id of shotIds) {
      expect((await api.getFolder(projectName, id)).status).toBe('In progress')
    }

    wizard = await overview.openImport()
    await wizard.upload(file)
    await wizard.setImportMode('Update only')
    await wizard.setDuplicateStrategy('Update all of them')
    await wizard.continueToValues()
    await wizard.continueToPreview({ updated: 2, errors: 0 })
    await wizard.importData({ updated: 2, errors: 0 })
    await wizard.close()

    for (const id of shotIds) {
      await expect.poll(async () => (await api.getFolder(projectName, id)).status).toBe('Approved')
    }
    await overview.expand('sq010')
    await overview.expand('sq020')
    await expect(overview.cell('sh010', 'status')).toContainText(['Approved', 'Approved'])
  })

  test('import folders and tasks from an Excel file', async ({ page, api, projectName }) => {
    await api.setWorkingViewColumns('overview', projectName, ['name', 'status', 'attrib_startDate'])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    const wizard = await overview.openImport()
    await wizard.importWithDefaults(HIERARCHY_XLSX, { created: 3, errors: 0 })

    await expect.poll(() => sortedPaths(api, projectName)).toEqual(['ep01', 'ep01/sh010'])
    expect(await getFolderByPath(api, projectName, 'ep01')).toMatchObject({
      folderType: 'Episode',
      status: 'In progress',
      attrib: { fps: 25 },
    })
    const shot = await getFolderByPath(api, projectName, 'ep01/sh010')
    expect(shot).toMatchObject({
      folderType: 'Shot',
      status: 'Ready to start',
      attrib: { frameStart: 1001, frameEnd: 1096, fps: 25 },
    })
    expect(shot.attrib.startDate).toMatch(/^2026-04-01T00:00:00/)
    const lighting = await getTaskByPath(api, projectName, 'ep01/sh010', 'lighting')
    expect(lighting).toMatchObject({ taskType: 'Lighting', status: 'Not ready' })
    expect(lighting.attrib.startDate).toMatch(/^2026-04-06T00:00:00/)

    await overview.expand('ep01')
    await overview.expand('sh010')
    await expect(overview.cell('sh010', 'status')).toContainText('Ready to start')
    await expect(overview.cell('sh010', 'attrib_startDate')).toHaveText('1 Apr 2026')
    await expect(overview.cell('lighting', 'attrib_startDate')).toHaveText('6 Apr 2026')
  })

  test('import a CSV with one folder or task type column', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.importCsv(COMBINED_TYPE_CSV, { created: 3 })

    await expect
      .poll(async () =>
        (await api.listFolders(projectName))
          .map((f) => [f.path, f.folderType, f.status])
          .sort((a, b) => a[0].localeCompare(b[0])),
      )
      .toEqual([
        ['sq100', 'Sequence', 'Not ready'],
        ['sq100/sh110', 'Shot', 'In progress'],
      ])
    const shot = (await api.listFolders(projectName)).find((f) => f.name === 'sh110')
    expect(
      (await api.listTasks(projectName, shot.id)).map((t) => [t.name, t.taskType, t.status]),
    ).toEqual([['layout', 'Layout', 'Approved']])
  })

  test('imported folders show in the open overview without a reload', async ({
    page,
    projectName,
  }) => {
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.importCsv(HIERARCHY_CSV, { created: 3 })

    await expect(overview.row('sq100')).toBeVisible()
    await expect(overview.sidebar().getByText('sq100', { exact: true })).toBeVisible()
    await overview.expand('sq100')
    await overview.expand('sh110')
    await expect(overview.row('layout')).toBeVisible()
  })
})
