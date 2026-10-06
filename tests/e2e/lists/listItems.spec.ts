import { expect, test } from '../fixtures'
import { addToList, ListsPage } from '../pages/ListsPage'
import { OverviewPage } from '../pages/OverviewPage'
import { ProductsPage } from '../pages/ProductsPage'
import { AyonApi } from '../support/api'
import { dialog, menuItem } from '../support/ui'

/** Shot sh010 with the tasks comp, anim and light, in a task list "Client picks" in that order */
const seedTaskList = async (api: AyonApi, projectName: string) => {
  const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const tasks = []
  for (const [name, taskType] of [
    ['comp', 'Compositing'],
    ['anim', 'Animation'],
    ['light', 'Lighting'],
  ]) {
    tasks.push(await api.createTask(projectName, { folderId: shot.id, name, taskType }))
  }
  const listId = await api.createEntityList(projectName, { label: 'Client picks' })
  for (const task of tasks) await api.addEntityListItem(projectName, listId, task.id)
  const [comp, anim, light] = tasks
  return { listId, comp, anim, light }
}

/** Product renderMain of shot sh010 with versions v001 and v002 (no media) */
const seedVersions = async (api: AyonApi, projectName: string) => {
  const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const product = await api.createProduct(projectName, { folderId: shot.id, name: 'renderMain' })
  const v1 = await api.createVersion(projectName, { productId: product.id, version: 1 })
  const v2 = await api.createVersion(projectName, { productId: product.id, version: 2 })
  return { shot, v1, v2 }
}

test.describe('list items', () => {
  test('reorder items by drag and drop', async ({ page, api, projectName }) => {
    const { listId, comp, anim, light } = await seedTaskList(api, projectName)
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Client picks')
    await expect(lists.itemNameCells()).toHaveText([/comp$/, /anim$/, /light$/])

    await lists.dragItem('light', 'comp')

    await expect(lists.itemNameCells()).toHaveText([/light$/, /comp$/, /anim$/])
    await expect
      .poll(async () => (await api.getEntityList(projectName, listId)).items.map((i) => i.entityId))
      .toEqual([light.id, comp.id, anim.id])
  })

  test('undo removing an item', async ({ page, api, projectName }) => {
    const { listId, comp, anim, light } = await seedTaskList(api, projectName)
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Client picks')
    await lists.removeItem('anim')
    await expect(lists.itemNameCell('anim')).toBeHidden()
    await expect
      .poll(async () => (await api.getEntityList(projectName, listId)).items.length)
      .toBe(2)

    // FLAG: icon-only button ("undo") in the items toolbar
    await page.getByRole('button', { name: 'undo', exact: true }).click()

    await expect(lists.itemNameCell('anim')).toBeVisible()
    await expect
      .poll(async () =>
        (await api.getEntityList(projectName, listId)).items.map((i) => i.entityId).sort(),
      )
      .toEqual([comp.id, anim.id, light.id].sort())
  })

  // FLAG (app bug): undo puts a removed item back at the end of the list instead of its old place.
  // The frontend does not remember positions: `addItemsBackToList` (useDeleteListItems.ts:53) merges
  // `{ id, entityId }` only, which the server appends. Passing the old position is not enough on its
  // own: `EntityList.add` (ayon-backend ayon_server/entity_lists/entity_list.py:287) stores
  // `position or 99999999`, so position 0 also lands at the end.
  // switch back to test() once both are fixed
  test.fixme('undo puts a removed item back in its place', async ({ page, api, projectName }) => {
    const { listId, comp, anim, light } = await seedTaskList(api, projectName)
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Client picks')
    await lists.removeItem('comp')
    await expect(lists.itemNameCell('comp')).toBeHidden()

    // FLAG: icon-only button ("undo") in the items toolbar
    await page.getByRole('button', { name: 'undo', exact: true }).click()

    await expect(lists.itemNameCells()).toHaveText([/comp$/, /anim$/, /light$/])
    await expect
      .poll(async () => (await api.getEntityList(projectName, listId)).items.map((i) => i.entityId))
      .toEqual([comp.id, anim.id, light.id])
  })

  test('set the status of several items at once', async ({ page, api, projectName }) => {
    const { comp, anim, light } = await seedTaskList(api, projectName)
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Client picks')
    await expect(lists.itemCell('comp', 'status')).toContainText('Not ready')

    await lists.clickItemCell('comp', 'status')
    await lists.clickItemCell('anim', 'status', { shift: true })
    await lists.pickForSelectedCells('In progress')

    await expect(lists.itemCell('comp', 'status')).toContainText('In progress')
    await expect(lists.itemCell('anim', 'status')).toContainText('In progress')
    await expect(lists.itemCell('light', 'status')).toContainText('Not ready')
    // list items are the entities themselves: the tasks changed
    await expect
      .poll(async () =>
        Promise.all(
          [comp, anim, light].map(async (t) => (await api.getTask(projectName, t.id)).status),
        ),
      )
      .toEqual(['In progress', 'In progress', 'Not ready'])
  })

  test('add versions to a version list from the products page', async ({
    page,
    api,
    projectName,
  }) => {
    const { v1, v2 } = await seedVersions(api, projectName)
    await api.createEntityList(projectName, { label: 'Dailies versions', entityType: 'version' })
    const products = new ProductsPage(page)
    await products.goto(projectName)

    await products.cell('renderMain - v001', 'name').click()
    await products.cell('renderMain - v002', 'name').click({ modifiers: ['Shift'] })
    await products.cell('renderMain - v002', 'name').click({ button: 'right' })
    await menuItem(page, 'Add to list').click()
    await addToList(page, 'Dailies versions')

    await expect
      .poll(async () => (await api.listEntityLists(projectName))[0].entityIds.sort())
      .toEqual([v1.id, v2.id].sort())
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Dailies versions')
    await expect(lists.itemNameCell('v001')).toBeVisible()
    await expect(lists.itemNameCell('v002')).toBeVisible()
  })

  test('versions can only be added to version lists', async ({ page, api, projectName }) => {
    await seedVersions(api, projectName)
    await api.createEntityList(projectName, { label: 'Shot tasks', entityType: 'task' })
    const products = new ProductsPage(page)
    await products.goto(projectName)

    await products.cell('renderMain - v001', 'name').click({ button: 'right' })
    await menuItem(page, 'Add to list (v001)').click()

    const addDialog = dialog(page, 'Add to list')
    await expect(addDialog).toBeVisible()
    const taskList = addDialog.getByRole('row').filter({ hasText: 'Shot tasks' })
    await expect(taskList).toContainText('This list only accepts task items')
    await taskList.click()
    await expect(addDialog.getByRole('button', { name: 'Add to list' })).toBeDisabled()
    expect((await api.listEntityLists(projectName))[0].entityIds).toEqual([])
  })

  test('add a folder to a folder list from the overview', async ({ page, api, projectName }) => {
    const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    await api.createFolder(projectName, { name: 'sh020', folderType: 'Shot' })
    await api.createEntityList(projectName, { label: 'Hero shots', entityType: 'folder' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.selectRow('sh010')
    await overview.nameCell('sh010').click({ button: 'right' })
    await menuItem(page, 'Add to list').click()
    await addToList(page, 'Hero shots')

    await expect
      .poll(async () => (await api.listEntityLists(projectName))[0].entityIds)
      .toEqual([shot.id])
  })
})
