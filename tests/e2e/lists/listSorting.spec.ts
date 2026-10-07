import { expect, test } from '../fixtures'
import { ListsPage } from '../pages/ListsPage'
import { AyonApi } from '../support/api'

const COLUMNS = ['name', 'attrib_fps', 'attrib_frameStart'].map((name) => ({ name, visible: true }))

const seedTaskList = async (api: AyonApi, projectName: string) => {
  const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const listId = await api.createEntityList(projectName, { label: 'Client picks' })
  // fps ties are broken by frameStart in a different order than the list order
  const values: [string, number, number][] = [
    ['t_a', 25, 30],
    ['t_b', 24, 40],
    ['t_c', 25, 10],
    ['t_d', 24, 20],
  ]
  for (const [name, fps, frameStart] of values) {
    const task = await api.createTask(projectName, { folderId: shot.id, name })
    await api.updateTask(projectName, task.id, { attrib: { fps, frameStart } })
    await api.addEntityListItem(projectName, listId, task.id)
  }
}

const items = (order: string) => order.split('').map((suffix) => new RegExp(`t_${suffix}$`))

test.describe('list items multi-key sorting', () => {
  const directions: [string, string[], string][] = [
    ['ascending then descending', ['attrib_fps', '-attrib_frameStart'], 'bdac'],
    ['descending then ascending', ['-attrib_fps', 'attrib_frameStart'], 'cadb'],
  ]

  for (const [title, sortBy, order] of directions) {
    test(`list items are sorted by two keys, ${title}`, async ({ page, api, projectName }) => {
      await seedTaskList(api, projectName)
      await api.setWorkingViewSettings('lists', projectName, { columns: COLUMNS, sortBy })
      const lists = new ListsPage(page)
      await lists.goto(projectName)

      await lists.openList('Client picks')

      await expect(lists.itemNameCells()).toHaveText(items(order))
    })
  }
})
