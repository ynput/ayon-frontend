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
