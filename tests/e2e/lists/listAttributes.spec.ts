import { expect, test } from '../fixtures'
import { hasPowerpack, ListsPage } from '../pages/ListsPage'
import { toast } from '../support/ui'

test.describe('list attributes', () => {
  test.beforeEach(async ({ api }) => {
    test.skip(!(await hasPowerpack(api)), 'list attributes need the powerpack addon')
  })

  test('add an attribute to a list', async ({ page, api, projectName }) => {
    const listId = await api.createEntityList(projectName, { label: 'Client picks' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Client picks')

    await lists.createListAttribute('Client note')

    await expect(toast(page, 'Attribute updated successfully')).toBeVisible()
    await expect
      .poll(() => api.getEntityListAttributes(projectName, listId))
      .toEqual([
        {
          name: 'clientNote',
          data: expect.objectContaining({ type: 'string', title: 'Client note' }),
        },
      ])
  })

  test('set a list attribute on an item', async ({ page, api, projectName }) => {
    const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const comp = await api.createTask(projectName, { folderId: shot.id, name: 'comp' })
    const anim = await api.createTask(projectName, { folderId: shot.id, name: 'anim' })
    const listId = await api.createEntityList(projectName, { label: 'Client picks' })
    await api.addEntityListItem(projectName, listId, comp.id)
    await api.addEntityListItem(projectName, listId, anim.id)
    await api.setEntityListAttributes(projectName, listId, [
      { name: 'clientNote', data: { type: 'string', title: 'Client note' } },
    ])
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Client picks')
    await lists.showItemColumn('Client note', 'Task attributes')

    await lists.editItemTextCell('comp', 'attrib_clientNote', 'More grain')

    await expect(lists.itemCell('comp', 'attrib_clientNote')).toHaveText('More grain')
    await expect
      .poll(async () =>
        (
          await api.getEntityList(projectName, listId)
        ).items.map((i) => [i.entityId, i.attrib.clientNote]),
      )
      .toEqual([
        [comp.id, 'More grain'],
        [anim.id, undefined],
      ])
    expect((await api.getTask(projectName, comp.id)).attrib.clientNote).toBeUndefined()
  })
})
