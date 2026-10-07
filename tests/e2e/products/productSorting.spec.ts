import { expect, test } from '../fixtures'
import { ProductsPage } from '../pages/ProductsPage'
import { AyonApi } from '../support/api'

const createVersions = async (api: AyonApi, projectName: string) => {
  const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  for (const [name, productType] of [
    ['renderMain', 'render'],
    ['modelMain', 'model'],
  ]) {
    const product = await api.createProduct(projectName, { folderId: shot.id, name, productType })
    await api.createVersion(projectName, { productId: product.id, version: 1 })
    await api.createVersion(projectName, { productId: product.id, version: 2 })
  }
}

test.describe('versions multi-key sorting', () => {
  const directions: [string, string[], RegExp[]][] = [
    [
      'product ascending then version descending',
      ['product', '-version'],
      [/modelMain - v002/, /modelMain - v001/, /renderMain - v002/, /renderMain - v001/],
    ],
    [
      'product descending then version ascending',
      ['-product', 'version'],
      [/renderMain - v001/, /renderMain - v002/, /modelMain - v001/, /modelMain - v002/],
    ],
  ]

  for (const [title, sortBy, order] of directions) {
    test(`the version list is sorted by ${title}`, async ({ page, api, projectName }) => {
      await createVersions(api, projectName)
      await api.setWorkingViewSettings('versions', projectName, { sortBy })
      const products = new ProductsPage(page)

      await products.goto(projectName)

      await expect(products.table.locator('tbody td.name')).toHaveText(order)
    })
  }
})
