import { expect, test } from '../fixtures'
import { csvFile } from '../pages/ImportDialog'
import { ListsPage } from '../pages/ListsPage'
import { requireAddon, withoutPowerLicense } from '../support/addons'
import { AyonApi } from '../support/api'

const findList = async (api: AyonApi, projectName: string, label: string) => {
  const list = (await api.listEntityLists(projectName)).find((l) => l.label === label)
  if (!list) throw new Error(`no list "${label}"`)
  return list
}

const seedShots = async (api: AyonApi, projectName: string, names: string[]) => {
  const shots: Record<string, { id: string }> = {}
  for (const name of names) {
    shots[name] = await api.createFolder(projectName, { name, folderType: 'Shot' })
  }
  return shots
}

test.describe('list CSV import', () => {
  // With the Power Pack, list imports keep their values on the list items (list values)
  test('create a list of tasks from a CSV with AYON columns', async ({
    page,
    api,
    projectName,
  }) => {
    await requireAddon(api, 'powerpack', { license: true })
    const { sh010, sh020 } = await seedShots(api, projectName, ['sh010', 'sh020'])
    const comp = await api.createTask(projectName, {
      folderId: sh010.id,
      name: 'comp',
      taskType: 'Compositing',
    })
    const anim = await api.createTask(projectName, {
      folderId: sh010.id,
      name: 'anim',
      taskType: 'Animation',
    })
    const comp2 = await api.createTask(projectName, {
      folderId: sh020.id,
      name: 'comp',
      taskType: 'Compositing',
    })
    const lists = new ListsPage(page)
    await lists.goto(projectName)

    const wizard = await lists.openCreateListFromCsv()
    await wizard.setNewList({ entityType: 'Tasks' })
    await wizard.upload(
      csvFile('Client review.csv', [
        ['folder_path', 'priority', 'frameStart'],
        ['sh010/comp', 'urgent', 1101],
        ['sh010/anim', 'high', 1201],
        ['sh020/comp', 'low', 1301],
      ]),
      { rows: 3 },
    )
    await expect(wizard.newListLabel).toHaveValue('Client review')
    await wizard.continueToValues()
    await wizard.continueToPreview({ created: 3, updated: 0, skipped: 0, errors: 0 })
    await wizard.importData({ created: 3, updated: 0, skipped: 0 })
    await wizard.openNewList()

    await expect(lists.listRow('Client review')).toBeVisible()
    await expect(lists.itemNameCells()).toHaveText([/comp$/, /anim$/, /comp$/])
    await lists.showItemColumn('Start frame', 'Task attributes')
    await expect(await lists.stableItemCell('anim', 'attrib_frameStart')).toHaveText('1201')
    const list = await findList(api, projectName, 'Client review')
    expect(list).toMatchObject({ entityType: 'task', entityIds: [comp.id, anim.id, comp2.id] })
    const { items } = await api.getEntityList(projectName, list.id)
    expect(items.map((i) => [i.entityId, i.attrib.priority, i.attrib.frameStart])).toEqual([
      [comp.id, 'urgent', 1101],
      [anim.id, 'high', 1201],
      [comp2.id, 'low', 1301],
    ])
    // the values are the list's own: the tasks keep theirs
    expect((await api.getTask(projectName, anim.id)).attrib.frameStart).not.toBe(1201)
  })

  test('map columns and values by hand when creating a list of folders', async ({
    page,
    api,
    projectName,
  }) => {
    // without the Power Pack, list imports set the values on the listed entities
    await withoutPowerLicense(page)
    const shots = await seedShots(api, projectName, ['sh010', 'sh020', 'sh030'])
    const lists = new ListsPage(page)
    await lists.goto(projectName)

    const wizard = await lists.openImportWithoutList()
    await wizard.upload(
      csvFile('Shot list.csv', [
        ['Shot', 'Shot status', 'Frames from', 'Notes'],
        ['sh010', 'wip', 1101, 'hero shot'],
        ['sh020', 'final', 1201, ''],
        ['sh030', 'tbd', 1301, 'needs a clean plate'],
      ]),
      { rows: 3 },
    )
    await wizard.mapColumn('Shot', 'Entity name')
    await wizard.mapColumn('Shot status', 'Status')
    await wizard.mapColumn('Frames from', 'Start frame')
    await wizard.skipColumn('Notes')
    await wizard.continueToValues()
    await wizard.mapValue('Status', 'wip', 'In progress')
    await wizard.mapValue('Status', 'final', 'Approved')
    await wizard.skipValue('Status', 'tbd')
    // the folders' values are updates of the folders, besides the new list items
    await wizard.continueToPreview({ created: 3, updated: 3, skipped: 0, errors: 0 })
    await wizard.importData({ created: 3, updated: 3, skipped: 0 })
    await wizard.openNewList()

    await expect(lists.listRow('Shot list')).toBeVisible()
    await expect(lists.itemCell('sh010', 'status')).toContainText('In progress')
    await expect(lists.itemCell('sh020', 'status')).toContainText('Approved')
    await expect(lists.itemCell('sh030', 'status')).toContainText('Not ready')
    const list = await findList(api, projectName, 'Shot list')
    expect(list).toMatchObject({
      entityType: 'folder',
      entityIds: [shots.sh010.id, shots.sh020.id, shots.sh030.id],
    })
    const folders = await Promise.all(
      ['sh010', 'sh020', 'sh030'].map((name) => api.getFolder(projectName, shots[name].id)),
    )
    expect(folders.map((f) => [f.name, f.status, f.attrib.frameStart])).toEqual([
      ['sh010', 'In progress', 1101],
      ['sh020', 'Approved', 1201],
      ['sh030', 'Not ready', 1301],
    ])
  })

  test('rows for folders already in the list are skipped', async ({ page, api, projectName }) => {
    const shots = await seedShots(api, projectName, ['sh010', 'sh020', 'sh030', 'sh040'])
    const listId = await api.createEntityList(projectName, {
      label: 'Plates',
      entityType: 'folder',
    })
    await api.addEntityListItem(projectName, listId, shots.sh010.id)
    await api.addEntityListItem(projectName, listId, shots.sh020.id)
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Plates')

    const wizard = await lists.openImportIntoList('Plates')
    await wizard.upload(
      csvFile('plates.csv', [['folder_path'], ['sh010'], ['sh030'], ['sh020'], ['sh040']]),
      { rows: 4 },
    )
    await wizard.continueToValues()
    await wizard.continueToPreview({ created: 2, updated: 0, skipped: 2, errors: 0 })
    await wizard.expectRowReasons(
      'skipped',
      { 1: 'Already in the list', 3: 'Already in the list' },
      false,
    )
    await wizard.importData({ created: 2, updated: 0, skipped: 2 })
    await wizard.close()

    await expect
      .poll(async () => (await api.getEntityList(projectName, listId)).items.map((i) => i.entityId))
      .toEqual([shots.sh010.id, shots.sh020.id, shots.sh030.id, shots.sh040.id])
    // the open list follows the import only through realtime events, so load it again
    await lists.goto(projectName)
    await lists.openList('Plates')
    await expect(lists.itemNameCells()).toHaveText([/sh010$/, /sh020$/, /sh030$/, /sh040$/])
  })

  test('an Update only import sets list values on the tasks already in the list', async ({
    page,
    api,
    projectName,
  }) => {
    await requireAddon(api, 'powerpack', { license: true })
    const { sh010 } = await seedShots(api, projectName, ['sh010'])
    const [comp, anim, light] = await Promise.all(
      ['comp', 'anim', 'light'].map((name) =>
        api.createTask(projectName, { folderId: sh010.id, name }),
      ),
    )
    const listId = await api.createEntityList(projectName, { label: 'Client picks' })
    await api.addEntityListItem(projectName, listId, comp.id)
    await api.addEntityListItem(projectName, listId, anim.id)
    await api.setEntityListAttributes(projectName, listId, [
      { name: 'clientNote', data: { type: 'string', title: 'Client note' } },
    ])
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Client picks')

    const wizard = await lists.openImportIntoList('Client picks')
    await wizard.setImportMode('Update only')
    await wizard.upload(
      csvFile('client notes.csv', [
        ['Entity path', 'Client note'],
        ['sh010/comp', 'More grain'],
        ['sh010/light', 'Too dark'],
        ['sh010/anim', 'Hold for the client'],
      ]),
      { rows: 3 },
    )
    await wizard.continueToValues()
    await wizard.continueToPreview({ created: 0, updated: 2, skipped: 1, errors: 0 })
    await wizard.expectRowReasons('skipped', { 2: 'The task is not in the list' }, false)
    await wizard.importData({ created: 0, updated: 2, skipped: 1 })
    await wizard.close()

    await expect
      .poll(async () =>
        (
          await api.getEntityList(projectName, listId)
        ).items.map((i) => [i.entityId, i.attrib.clientNote]),
      )
      .toEqual([
        [comp.id, 'More grain'],
        [anim.id, 'Hold for the client'],
      ])
    // the open list follows the import only through realtime events, so load it again
    await lists.goto(projectName)
    await lists.openList('Client picks')
    await lists.showItemColumn('Client note', 'Task attributes')
    await expect(await lists.stableItemCell('comp', 'attrib_clientNote')).toHaveText('More grain')
    expect((await api.getTask(projectName, comp.id)).attrib.clientNote).toBeUndefined()
    expect((await api.getTask(projectName, light.id)).attrib.clientNote).toBeUndefined()
  })

  test('without the Power Pack, an import into a list updates the listed folders', async ({
    page,
    api,
    projectName,
  }) => {
    await withoutPowerLicense(page)
    const shots = await seedShots(api, projectName, ['sh010', 'sh020'])
    const listId = await api.createEntityList(projectName, {
      label: 'Layout check',
      entityType: 'folder',
    })
    await api.addEntityListItem(projectName, listId, shots.sh010.id)
    await api.addEntityListItem(projectName, listId, shots.sh020.id)
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Layout check')
    await expect(lists.itemCell('sh010', 'status')).toContainText('Not ready')

    const wizard = await lists.openImportIntoList('Layout check')
    await wizard.upload(
      csvFile('layout status.csv', [
        ['folder_path', 'status'],
        ['sh010', 'In progress'],
        ['sh020', 'Approved'],
      ]),
      { rows: 2 },
    )
    await wizard.continueToValues()
    await wizard.continueToPreview({ created: 0, updated: 2, skipped: 0, errors: 0 })
    await wizard.importData({ created: 0, updated: 2, skipped: 0 })
    await wizard.close()

    expect((await api.getFolder(projectName, shots.sh010.id)).status).toBe('In progress')
    expect((await api.getFolder(projectName, shots.sh020.id)).status).toBe('Approved')
    // the open list follows the import only through realtime events, so load it again
    await lists.goto(projectName)
    await lists.openList('Layout check')
    await expect(lists.itemCell('sh010', 'status')).toContainText('In progress')
    await expect(lists.itemCell('sh020', 'status')).toContainText('Approved')
    expect((await api.getEntityList(projectName, listId)).items.map((i) => i.entityId)).toEqual([
      shots.sh010.id,
      shots.sh020.id,
    ])
  })

  test('create a list of versions from a CSV inside a list folder', async ({
    page,
    api,
    projectName,
  }) => {
    await requireAddon(api, 'powerpack', { license: true })
    const { sh010 } = await seedShots(api, projectName, ['sh010'])
    const product = await api.createProduct(projectName, {
      folderId: sh010.id,
      name: 'renderMain',
    })
    const v1 = await api.createVersion(projectName, { productId: product.id, version: 1 })
    const v2 = await api.createVersion(projectName, { productId: product.id, version: 2 })
    const folderId = await api.createEntityListFolder(projectName, { label: 'Dailies' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)

    const wizard = await lists.openCreateListFromCsvIn('Dailies')
    await wizard.setNewList({ entityType: 'Versions' })
    await wizard.upload(csvFile('Monday review.csv', [['entity_id'], [v2.id], [v1.id]]), {
      rows: 2,
    })
    await wizard.continueToValues()
    await wizard.continueToPreview({ created: 2, skipped: 0, errors: 0 })
    await wizard.importData({ created: 2, skipped: 0 })
    await wizard.openNewList()

    await expect(lists.listRow('Monday review')).toBeVisible()
    await expect(lists.itemNameCells()).toHaveText([/v002$/, /v001$/])
    const list = await findList(api, projectName, 'Monday review')
    expect(list).toMatchObject({ entityType: 'version', entityIds: [v2.id, v1.id] })
    expect((await api.getEntityList(projectName, list.id)).entityListFolderId).toBe(folderId)
  })

  test('a name that matches two folders adds both with "Use all of them"', async ({
    page,
    api,
    projectName,
  }) => {
    const sq010 = await api.createFolder(projectName, { name: 'sq010', folderType: 'Sequence' })
    const sq020 = await api.createFolder(projectName, { name: 'sq020', folderType: 'Sequence' })
    const first = await api.createFolder(projectName, { name: 'sh010', parentId: sq010.id })
    const second = await api.createFolder(projectName, { name: 'sh010', parentId: sq020.id })
    const other = await api.createFolder(projectName, { name: 'sh020', parentId: sq010.id })
    const lists = new ListsPage(page)
    await lists.goto(projectName)

    const wizard = await lists.openCreateListFromCsv()
    await wizard.upload(csvFile('Edit sequence.csv', [['name'], ['sh010'], ['sh020']]), {
      rows: 2,
    })
    await wizard.continueToValues()
    // by default a row whose name matches several folders is not imported
    await wizard.continueToPreview({ created: 1, skipped: 1, errors: 1 })
    await wizard.expectRowReasons(
      'errors',
      {
        1: "Name 'sh010' matches 2 folders, map an Entity path column or choose to add all of them",
      },
      false,
    )
    await wizard.openStep('Map columns')
    await wizard.setDuplicateStrategy('Use all of them')
    await wizard.continueToValues()
    await wizard.continueToPreview({ created: 3, skipped: 0, errors: 0 })
    await wizard.importData({ created: 3, skipped: 0, errors: 0 })
    await wizard.openNewList()

    await expect(lists.itemNameCells()).toHaveCount(3)
    const list = await findList(api, projectName, 'Edit sequence')
    expect(list.entityType).toBe('folder')
    expect([...list.entityIds].sort()).toEqual([first.id, second.id, other.id].sort())
  })
})
