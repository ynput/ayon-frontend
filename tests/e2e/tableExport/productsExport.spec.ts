import { expect, test } from '../fixtures'
import { ExportDialog, expectTableHeaders, exportFileName } from '../pages/ExportDialog'
import { ProductsPage } from '../pages/ProductsPage'
import { AyonApi } from '../support/api'
import { requireTableExport } from './requireTableExport'

// representation names differ from the file extensions, as in representationFilter.spec.ts
const PUBLISHES: [product: string, productType: string, representation: string][] = [
  ['renderMain', 'render', 'beauty'],
  ['modelMain', 'model', 'cache'],
]

/** Two versions of each product, every version with one representation */
const publish = async (api: AyonApi, projectName: string) => {
  const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  for (const [name, productType, representation] of PUBLISHES) {
    const product = await api.createProduct(projectName, { folderId: shot.id, name, productType })
    for (const version of [1, 2]) {
      const { id } = await api.createVersion(projectName, { productId: product.id, version })
      const path = `{root[work]}/${projectName}/sh010/publish/${name}/v00${version}/${name}.exr`
      await api.createRepresentation(projectName, {
        versionId: id,
        name: representation,
        files: [path],
        attrib: { path },
      })
    }
  }
}

/** the first column of an export: the version and product names */
const names = (rows: string[][]) => rows.slice(1).map((row) => row[0])

test.describe('products table export', () => {
  test.beforeEach(async ({ api }) => {
    await requireTableExport(api)
  })

  test('the version list exports in the view sort order, as CSV with semicolons', async ({
    page,
    api,
    projectName,
  }) => {
    await publish(api, projectName)
    await api.setWorkingViewSettings('versions', projectName, { sortBy: ['product', '-version'] })
    const products = new ProductsPage(page)
    await products.goto(projectName)
    const tableNames = [
      /modelMain - v002/,
      /modelMain - v001/,
      /renderMain - v002/,
      /renderMain - v001/,
    ]
    await expect(products.table.locator('tbody td.name')).toHaveText(tableNames)
    const exportDialog = new ExportDialog(page)

    await exportDialog.openFromToolbar()
    await exportDialog.choose('CSV')
    await exportDialog.setDelimiter('Semicolon')
    const file = await exportDialog.export()

    expect(file.fileName).toBe(exportFileName(projectName, 'table', 'csv'))
    await expectTableHeaders(file, products.table)
    // FLAG: the table shows versions as "product - v001", the export as "product v001"
    expect(names(file.rows)).toEqual([
      'modelMain v002',
      'modelMain v001',
      'renderMain v002',
      'renderMain v001',
    ])
  })

  test('a representation filter limits the exported versions', async ({
    page,
    api,
    projectName,
  }) => {
    await publish(api, projectName)
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await expect(products.row('modelMain - v001')).toBeVisible()

    await products.filters.addText('Representation', 'Name', 'beauty')
    await expect(products.row('modelMain - v001')).toBeHidden()
    const exportDialog = new ExportDialog(page)
    await exportDialog.openFromToolbar()
    const file = await exportDialog.export()

    expect(names(file.rows).sort()).toEqual(['renderMain v001', 'renderMain v002'])
  })

  test('the product list exports each product followed by its versions', async ({
    page,
    api,
    projectName,
  }) => {
    await publish(api, projectName)
    // render before model
    await api.setWorkingViewSettings('versions', projectName, {
      showProducts: true,
      sortBy: ['-subType'],
    })
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await expect(products.table.locator('tbody td.name')).toHaveText([/renderMain/, /modelMain/])
    const exportDialog = new ExportDialog(page)

    await exportDialog.openFromToolbar()
    await exportDialog.expectChosen('Whole table', 'Excel (.xlsx)', 'Readable')
    const file = await exportDialog.export()

    await expectTableHeaders(file, products.table)
    expect(names(file.rows)).toEqual([
      'renderMain',
      expect.stringMatching(/^renderMain v00[12]$/),
      expect.stringMatching(/^renderMain v00[12]$/),
      'modelMain',
      expect.stringMatching(/^modelMain v00[12]$/),
      expect.stringMatching(/^modelMain v00[12]$/),
    ])
  })

  test('export the selected versions from the context menu', async ({ page, api, projectName }) => {
    await publish(api, projectName)
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await products.cell('renderMain - v002', 'name').click()
    await products.cell('modelMain - v001', 'name').click({ modifiers: ['ControlOrMeta'] })
    await expect(products.table.locator('td.name.selected')).toHaveCount(2)
    const exportDialog = new ExportDialog(page)

    await exportDialog.openFromContextMenu(products.cell('modelMain - v001', 'name'))
    await expect(exportDialog.option('Selected rows')).toContainText('2 rows')
    const file = await exportDialog.export()

    expect(file.fileName).toBe(exportFileName(projectName, 'selection', 'xlsx'))
    expect(file.rows).toHaveLength(3)
    expect(names(file.rows).sort()).toEqual(['modelMain v001', 'renderMain v002'])
  })
})
