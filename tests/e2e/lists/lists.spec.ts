import { expect, test } from '../fixtures'
import { confirmDialog, menuItem } from '../support/ui'
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

  test('right-clicking another list keeps the selection', async ({ page, api, projectName }) => {
    await api.createEntityList(projectName, { label: 'Picked' })
    await api.createEntityList(projectName, { label: 'Other' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.selectListRow('Picked')

    await lists.listRow('Other').click({ button: 'right' })

    await expect(menuItem(page, 'Delete')).toBeVisible()
    await expect(lists.listRow('Picked').locator('.selected')).toBeVisible()
    await expect(lists.listRow('Other').locator('.selected')).toBeHidden()

    await menuItem(page, 'Delete').click()
    await confirmDialog(page).getByRole('button', { name: 'Delete' }).click()

    await expect
      .poll(async () => (await api.listEntityLists(projectName)).map((l) => l.label))
      .toEqual(['Picked'])
    await expect(lists.listRow('Picked').locator('.selected')).toBeVisible()
  })

  test('deleting another list keeps a selection made after the lists changed', async ({
    page,
    api,
    projectName,
  }) => {
    await api.createEntityList(projectName, { label: 'Old list' })
    await api.createEntityList(projectName, { label: 'Picked' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    // the rename refreshes the lists while "Old list" is the selection
    await lists.selectListRow('Old list')
    await lists.renameList('Old list', 'Stale list')
    await lists.selectListRow('Picked')

    await lists.deleteList('Stale list')

    await expect(lists.listRow('Stale list')).toBeHidden()
    await expect(lists.listRow('Picked').locator('.selected')).toBeVisible()
  })

  test('details from the menu of another list open that list', async ({
    page,
    api,
    projectName,
  }) => {
    await api.createEntityList(projectName, { label: 'Picked' })
    await api.createEntityList(projectName, { label: 'Other' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.selectListRow('Picked')

    await lists.rowMenu('Other', 'Details')

    await expect(page.getByRole('heading', { name: 'Other', level: 2 })).toBeVisible()
    await expect(lists.listRow('Other').locator('.selected')).toBeVisible()
    await expect(lists.listRow('Picked').locator('.selected')).toBeHidden()
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
