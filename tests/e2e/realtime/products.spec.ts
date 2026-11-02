import { expect, test } from '../fixtures'
import { ProductsPage } from '../pages/ProductsPage'
import { expectSyncHighlighted, LIVE_UPDATE, LiveUpdates, syncButton, updateVersion } from './live'

test.describe('products live updates', () => {
  // FLAG (app bug): versions published elsewhere are streamed in and the sync button never highlights for them
  // fixed in ynput/ayon-frontend#2423, switch back to test() once it is merged
  test.fixme(
    'a version published elsewhere is not streamed in: the sync button highlights and syncing shows it',
    async ({ page, api, projectName }) => {
      const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
      const render = await api.createProduct(projectName, { folderId: shot.id, name: 'renderMain' })
      const v001 = await api.createVersion(projectName, { productId: render.id, version: 1 })

      const products = new ProductsPage(page)
      const live = new LiveUpdates(page)
      await products.goto(projectName)
      await expect(products.row('renderMain - v001')).toBeVisible()
      await expect(products.cell('renderMain - v001', 'status')).not.toContainText('Approved')
      await live.expectSubscribed('entity.version.created', projectName)

      await api.createVersion(projectName, { productId: render.id, version: 2 })
      // a status change is applied after the versions fetched in the same batch, a streamed creation included
      await updateVersion(api, projectName, v001.id, { status: 'Approved' })

      await expect(products.cell('renderMain - v001', 'status')).toContainText(
        'Approved',
        LIVE_UPDATE,
      )
      await expect(products.row('renderMain - v002')).toBeHidden()
      const sync = syncButton(products.table)
      await expectSyncHighlighted(sync, /new version/)

      await sync.click()

      await expect(products.row('renderMain - v002')).toBeVisible()
      await expect(sync).not.toHaveClass(/has-updates/)
    },
  )
})
