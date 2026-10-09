import { expect, test } from '../fixtures'
import { ProductsPage } from '../pages/ProductsPage'
import { AyonApi } from '../support/api'

// representation names differ from the file extensions, so a name match cannot pass for an extension match
const PUBLISHES: [product: string, representation: string, file: string][] = [
  ['renderMain', 'beauty', 'renderMain.exr'],
  ['modelMain', 'cache', 'modelMain.abc'],
  ['layoutMain', 'manifest', 'layoutMain.abc.json'],
]

const publish = async (api: AyonApi, projectName: string) => {
  const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  for (const [name, representation, file] of PUBLISHES) {
    const product = await api.createProduct(projectName, { folderId: shot.id, name })
    const version = await api.createVersion(projectName, { productId: product.id, version: 1 })
    const path = `{root[work]}/${projectName}/sh010/publish/${name}/v001/${file}`
    await api.createRepresentation(projectName, {
      versionId: version.id,
      name: representation,
      files: [path],
      attrib: { path },
    })
  }
}

const savedFilter = (api: AyonApi, projectName: string) => async () =>
  (await api.getWorkingViewSettings('versions', projectName))?.filter?.conditions ?? []

test.describe('products representation filter', () => {
  test('filter versions by representation name', async ({ page, api, projectName }) => {
    await publish(api, projectName)
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await expect(products.row('modelMain - v001')).toBeVisible()

    await products.filters.addText('Representation', 'Name', 'beauty')

    await expect(products.filters.chip('Representation Name')).toContainText('beauty')
    await expect(products.row('modelMain - v001')).toBeHidden()
    await expect(products.row('layoutMain - v001')).toBeHidden()
    await expect(products.row('renderMain - v001')).toBeVisible()
    await expect
      .poll(savedFilter(api, projectName))
      .toEqual([{ key: 'representation_name', value: '%beauty%', operator: 'like' }])
  })

  test('filter versions by file extension', async ({ page, api, projectName }) => {
    await publish(api, projectName)
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await expect(products.row('renderMain - v001')).toBeVisible()

    await products.filters.addText('Representation', 'File Extension', 'abc')

    await expect(products.filters.chip('Representation File Extension')).toContainText('abc')
    await expect(products.row('renderMain - v001')).toBeHidden()
    await expect(products.row('layoutMain - v001')).toBeHidden()
    await expect(products.row('modelMain - v001')).toBeVisible()
    await expect
      .poll(savedFilter(api, projectName))
      .toEqual([{ key: 'representation_extension', value: '%abc%', operator: 'like' }])
  })

  // needs ynput/ayon-backend#1190: the products resolver does not take representationFilter yet
  test.fixme('filter product rows by representation name', async ({ page, api, projectName }) => {
    await publish(api, projectName)
    await api.setWorkingViewSettings('versions', projectName, { showProducts: true })
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await expect(products.row('modelMain')).toBeVisible()

    await products.filters.addText('Representation', 'Name', 'beauty')

    await expect(products.filters.chip('Representation Name')).toContainText('beauty')
    await expect(products.row('modelMain')).toBeHidden()
    await expect(products.row('layoutMain')).toBeHidden()
    await expect(products.row('renderMain')).toBeVisible()
  })
})
