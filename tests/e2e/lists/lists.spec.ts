import { expect, test } from '../fixtures'
import { menuItem } from '../support/ui'
import { addToList, ListsPage } from '../pages/ListsPage'
import { OverviewPage } from '../pages/OverviewPage'

test.describe('lists', () => {
  test('create a task list', async ({ page, api, projectName }) => {
    const lists = new ListsPage(page)
    await lists.goto(projectName)

    await lists.createList({ label: 'Dailies picks', entityType: 'task' })

    await expect(lists.listRow('Dailies picks')).toBeVisible()
    await expect
      .poll(async () =>
        (await api.listEntityLists(projectName)).map((l) => [l.label, l.entityType]),
      )
      .toEqual([['Dailies picks', 'task']])
  })

  test('add a task to a list from the overview', async ({ page, api, projectName }) => {
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'comp',
      taskType: 'Compositing',
    })
    await api.createEntityList(projectName, { label: 'Client review' })

    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')
    await overview.selectRow('comp')
    await overview.nameCell('comp').click({ button: 'right' })
    await menuItem(page, 'Add to list').click()
    await addToList(page, 'Client review')

    await expect
      .poll(async () => (await api.listEntityLists(projectName))[0].entityIds)
      .toEqual([task.id])
  })

  test('delete a list', async ({ page, api, projectName }) => {
    await api.createEntityList(projectName, { label: 'Keep list' })
    await api.createEntityList(projectName, { label: 'Old list' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)

    await lists.deleteList('Old list')

    await expect(lists.listRow('Old list')).toBeHidden()
    await expect
      .poll(async () => (await api.listEntityLists(projectName)).map((l) => l.label))
      .toEqual(['Keep list'])
  })
})

test.describe('list contents', () => {
  test('rename a list', async ({ page, api, projectName }) => {
    const listId = await api.createEntityList(projectName, { label: 'Dailies' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)

    await lists.renameList('Dailies', 'Dailies Monday')

    await expect(lists.listRow('Dailies Monday')).toBeVisible()
    await expect
      .poll(async () => (await api.listEntityLists(projectName)).map((l) => [l.id, l.label]))
      .toEqual([[listId, 'Dailies Monday']])
  })

  test('remove an item from a list', async ({ page, api, projectName }) => {
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const comp = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'comp',
      taskType: 'Compositing',
    })
    const anim = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'anim',
      taskType: 'Animation',
    })
    const listId = await api.createEntityList(projectName, { label: 'Client review' })
    await api.addEntityListItem(projectName, listId, comp.id)
    await api.addEntityListItem(projectName, listId, anim.id)

    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Client review')
    await expect(lists.itemNameCell('comp')).toBeVisible()

    await lists.removeItem('comp')

    await expect(lists.itemNameCell('comp')).toBeHidden()
    await expect(lists.itemNameCell('anim')).toBeVisible()
    await expect
      .poll(async () => (await api.listEntityLists(projectName))[0].entityIds)
      .toEqual([anim.id])
  })

  // FLAG (app bug): list details "Items count" is always 0 (fetched with metadataOnly, then counts list.items)
  // fixed in ynput/ayon-frontend#2396, switch back to test() once it is merged
  test.fixme(
    'list details show how many items the list has',
    async ({ page, api, projectName }) => {
      const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
      const task = await api.createTask(projectName, { folderId: folder.id, name: 'comp' })
      const listId = await api.createEntityList(projectName, { label: 'Picks' })
      await api.addEntityListItem(projectName, listId, task.id)

      const lists = new ListsPage(page)
      await lists.goto(projectName)
      await expect(lists.listRow('Picks')).toContainText('1')

      await lists.openDetails('Picks')

      await expect(lists.detail('Items count')).toHaveText('1')
    },
  )
})
