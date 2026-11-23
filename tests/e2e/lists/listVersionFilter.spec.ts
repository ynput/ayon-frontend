import { expect, test } from '../fixtures'
import { ListsPage } from '../pages/ListsPage'
import { SearchFilterBar } from '../pages/SearchFilterBar'

test('version list: the Version filter keeps Latest Done, Latest and version numbers', async ({
  page,
  api,
  projectName,
}) => {
  const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const product = await api.createProduct(projectName, {
    folderId: shot.id,
    name: 'renderMain',
    productType: 'render',
  })
  const listId = await api.createEntityList(projectName, {
    label: 'Dailies',
    entityType: 'version',
  })
  for (const [version, status] of [
    [1, 'Approved'],
    [2, 'Approved'],
    [3, 'In progress'],
  ] as const) {
    const { id } = await api.createVersion(projectName, { productId: product.id, version, status })
    await api.addEntityListItem(projectName, listId, id)
  }

  const lists = new ListsPage(page)
  await lists.goto(projectName)
  await lists.openList('Dailies')
  await expect(lists.itemNameCells()).toHaveText([/v001/, /v002/, /v003/])

  await new SearchFilterBar(page).add('Version', 'Latest Done')
  await expect(lists.itemNameCells()).toHaveText([/v002/])

  // Latest together with a version number: both apply, as on the Products page
  await api.setWorkingViewSettings('lists', projectName, {
    filter: {
      operator: 'and',
      conditions: [{ key: 'entity_version', operator: 'in', value: ['latest', '3'] }],
    },
  })
  await lists.goto(projectName)
  await lists.openList('Dailies')
  await expect(lists.itemNameCells()).toHaveText([/v003/])
})
