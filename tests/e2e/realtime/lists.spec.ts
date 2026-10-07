import { expect, test } from '../fixtures'
import { ListsPage } from '../pages/ListsPage'
import { LIVE_UPDATE, LiveUpdates } from './live'

test.describe('lists live updates', () => {
  test('an item added to the open list elsewhere appears in it', async ({
    page,
    api,
    projectName,
  }) => {
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

    const lists = new ListsPage(page)
    const live = new LiveUpdates(page)
    await lists.goto(projectName)
    await lists.openList('Client review')
    await expect(lists.itemNameCell('comp')).toBeVisible()
    await expect(lists.itemNameCell('anim')).toBeHidden()
    await live.expectSubscribed('entity_list.changed', projectName)

    await api.addEntityListItem(projectName, listId, anim.id)

    await expect(lists.itemNameCell('anim')).toBeVisible(LIVE_UPDATE)
    await expect(lists.itemNameCell('comp')).toBeVisible()
  })

  test('a list created elsewhere appears in the open lists page', async ({
    page,
    api,
    projectName,
  }) => {
    await api.createEntityList(projectName, { label: 'Client review' })

    const lists = new ListsPage(page)
    const live = new LiveUpdates(page)
    await lists.goto(projectName)
    await expect(lists.listRow('Client review')).toBeVisible()
    await expect(lists.listRow('Dailies')).toBeHidden()
    await live.expectSubscribed('entity_list.created', projectName)

    await api.createEntityList(projectName, { label: 'Dailies' })

    await expect(lists.listRow('Dailies')).toBeVisible(LIVE_UPDATE)
    await expect(lists.listRow('Client review')).toBeVisible()
  })
})
