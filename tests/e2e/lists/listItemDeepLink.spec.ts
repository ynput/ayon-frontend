import { expect, test } from '../fixtures'
import { DetailsPanel } from '../pages/DetailsPanel'
import { ListsPage } from '../pages/ListsPage'
import { AyonApi } from '../support/api'
import { toast } from '../support/ui'

const deepLink = (page: string, param: string, listId: string, itemIds: string[]) =>
  `${page}?${param}=${listId}${itemIds.map((id) => `&listItemId=${id}`).join('')}`

const seedFolderList = async (api: AyonApi, projectName: string, count: number) => {
  const folders = []
  for (let i = 1; i <= count; i++) {
    const name = `f${String(i).padStart(3, '0')}`
    folders.push(await api.createFolder(projectName, { name }))
  }
  const listId = await api.createEntityList(projectName, { label: 'Linked', entityType: 'folder' })
  for (const folder of folders) await api.addEntityListItem(projectName, listId, folder.id)
  return { listId, folders }
}

const selectedNames = (lists: ListsPage) => lists.itemsTable.locator('td.name.selected-row')

test.describe('list item links', () => {
  test('select every linked item, also past the first page', async ({ page, api, projectName }) => {
    test.slow()
    // more than one page of items (100), and f005 in the list twice
    const { listId, folders } = await seedFolderList(api, projectName, 110)
    await api.addEntityListItem(projectName, listId, folders[4].id)
    const items = (await api.getEntityList(projectName, listId)).items
    const f105 = items.find((i) => i.entityId === folders[104].id)!
    const [, f005Again] = items.filter((i) => i.entityId === folders[4].id)

    const lists = new ListsPage(page)
    await page.goto(
      deepLink(`/projects/${projectName}/lists`, 'list', listId, [f105.id, f005Again.id]),
    )

    // scrolled to the first linked row, near the end; the f005 at the top stays unselected
    await expect(selectedNames(lists)).toHaveText([/f105$/, /f005$/], { timeout: 30_000 })
    await expect(selectedNames(lists).first()).toBeInViewport()
    await expect(page).not.toHaveURL(/listItemId/)
  })

  test('offer to clear filters that hide a linked item', async ({ page, api, projectName }) => {
    const { listId, folders } = await seedFolderList(api, projectName, 2)
    await api.updateFolder(projectName, folders[0].id, { attrib: { priority: 'urgent' } })
    await api.setWorkingViewSettings('lists', projectName, {
      filter: {
        operator: 'and',
        conditions: [{ key: 'attrib.priority', operator: 'in', value: ['urgent'] }],
      },
    })
    const items = (await api.getEntityList(projectName, listId)).items
    const hidden = items.find((i) => i.entityId === folders[1].id)!

    const lists = new ListsPage(page)
    await page.goto(deepLink(`/projects/${projectName}/lists`, 'list', listId, [hidden.id]))

    const notShown = toast(page, '1 linked item is not shown')
    await expect(notShown).toBeVisible({ timeout: 30_000 })
    await expect(lists.itemNameCell('f002')).toBeHidden()
    await notShown.getByRole('button', { name: 'Clear filters' }).click()

    await expect(selectedNames(lists)).toHaveText([/f002$/])
    await expect
      .poll(
        async () => (await api.getWorkingViewSettings('lists', projectName))?.filter?.conditions,
      )
      .toEqual([])
  })

  test('select linked versions on the review page', async ({ page, api, projectName }) => {
    const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const product = await api.createProduct(projectName, { folderId: shot.id, name: 'renderMain' })
    const v1 = await api.createVersion(projectName, { productId: product.id, version: 1 })
    const v2 = await api.createVersion(projectName, { productId: product.id, version: 2 })
    const listId = await api.createEntityList(projectName, {
      label: 'Dailies',
      entityType: 'version',
      entityListType: 'review-session',
    })
    for (const version of [v1, v2, v1]) await api.addEntityListItem(projectName, listId, version.id)
    const v1Items = (await api.getEntityList(projectName, listId)).items.filter(
      (i) => i.entityId === v1.id,
    )

    await page.goto(
      deepLink(
        `/projects/${projectName}/reviews`,
        'review',
        listId,
        v1Items.map((i) => i.id),
      ),
    )

    // the review page may show cards instead of the table, the details panel shows either way
    await expect(new DetailsPanel(page).header).toContainText('2 versions', { timeout: 30_000 })
    await expect(page).not.toHaveURL(/listItemId/)
  })
})
