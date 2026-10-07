import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { ProductsPage } from '../pages/ProductsPage'
import { OverviewPage } from '../pages/OverviewPage'
import { MEDIA } from '../media'
import { expandAllRows, readMainCount, rowLabels } from '../support/summary'

// shots/sh010: renderA v1 v2 (approved), plateA v1; shots/sh020: renderB v1; assets/hero: modelA v1 v2
const createProjectProducts = async (api: AyonApi, projectName: string) => {
  const folder = async (name: string, folderType: string, parentId?: string) =>
    (await api.createFolder(projectName, { name, folderType, parentId })).id
  const product = async (folderId: string, name: string, productType: string) =>
    (await api.createProduct(projectName, { folderId, name, productType })).id
  const version = (productId: string, version: number, status = 'Not ready') =>
    api.createVersion(projectName, { productId, version, status })

  const shots = await folder('shots', 'Folder')
  const sh010 = await folder('sh010', 'Shot', shots)
  const sh020 = await folder('sh020', 'Shot', shots)
  const assets = await folder('assets', 'Folder')
  const hero = await folder('hero', 'Asset', assets)

  const renderA = await product(sh010, 'renderA', 'render')
  await version(renderA, 1)
  const approved = await version(renderA, 2, 'Approved')
  const plateA = await product(sh010, 'plateA', 'plate')
  await version(plateA, 1)
  const renderB = await product(sh020, 'renderB', 'render')
  await version(renderB, 1)
  const modelA = await product(hero, 'modelA', 'model')
  await version(modelA, 1)
  await version(modelA, 2)
  return { approved }
}

const folderName = (...names: string[]) =>
  names.length === 1
    ? { key: 'folder_name', value: `%${names[0]}%`, operator: 'like' }
    : {
        operator: 'or',
        conditions: names.map((name) => ({
          key: 'folder_name',
          value: `%${name}%`,
          operator: 'like',
        })),
      }
const versionStatus = (status: string) => ({
  key: 'version_status',
  value: [status],
  operator: 'in',
})

const openWithView = async (
  api: AyonApi,
  products: ProductsPage,
  projectName: string,
  { conditions = [], ...settings }: { conditions?: object[]; [key: string]: unknown } = {},
) => {
  await api.setWorkingViewSettings('versions', projectName, {
    ...settings,
    filter: { operator: 'and', conditions },
  })
  await products.goto(projectName)
}

/** "renderA - v002 ★" -> "renderA - v002" */
const versionLabel = (label: string) => label.replace(/★/g, '').trim()

/**
 * The versions list (one row per version) matches the summary, which counts versions only.
 * `versions` are the expected rows ("renderA - v001").
 */
const expectSummaryToMatchVersionsList = async (products: ProductsPage, versions: string[]) => {
  const table = products.table
  await expect
    .poll(async () => (await rowLabels(table)).map(versionLabel).sort())
    .toEqual([...versions].sort())
  await expect.poll(() => readMainCount(table)).toEqual({ version: versions.length })
}

/**
 * The products view (products with their versions as child rows) matches the summary.
 * `rows` maps every expected product row to its version rows ("v001").
 */
const expectSummaryToMatchProductsView = async (
  products: ProductsPage,
  rows: Record<string, string[]>,
) => {
  const table = products.table
  const expected = Object.entries(rows).flatMap(([product, versions]) => [
    product,
    ...versions.map((version) => `${product} - ${version}`),
  ])
  await expect
    .poll(async () => {
      await expandAllRows(table)
      return (await rowLabels(table))
        .filter((label) => label !== 'No versions')
        .map(versionLabel)
        .sort()
    })
    .toEqual(expected.sort())
  await expect
    .poll(() => readMainCount(table))
    .toEqual({
      product: Object.keys(rows).length,
      version: Object.values(rows).flat().length,
    })
}

test.describe('products summary matches the table', () => {
  test('versions list without filters', async ({ page, api, projectName }) => {
    await createProjectProducts(api, projectName)
    const products = new ProductsPage(page)
    await openWithView(api, products, projectName)
    await expectSummaryToMatchVersionsList(products, [
      'renderA - v001',
      'renderA - v002',
      'plateA - v001',
      'renderB - v001',
      'modelA - v001',
      'modelA - v002',
    ])
  })

  test('versions list filtered by one folder name', async ({ page, api, projectName }) => {
    await createProjectProducts(api, projectName)
    const products = new ProductsPage(page)
    await openWithView(api, products, projectName, { conditions: [folderName('sh010')] })
    await expectSummaryToMatchVersionsList(products, [
      'renderA - v001',
      'renderA - v002',
      'plateA - v001',
    ])
  })

  test('versions list filtered by a list of folder names', async ({ page, api, projectName }) => {
    await createProjectProducts(api, projectName)
    const products = new ProductsPage(page)
    await openWithView(api, products, projectName, {
      conditions: [folderName('sh010', 'sh020')],
    })
    await expectSummaryToMatchVersionsList(products, [
      'renderA - v001',
      'renderA - v002',
      'plateA - v001',
      'renderB - v001',
    ])
  })

  test('versions list filtered by version status', async ({ page, api, projectName }) => {
    await createProjectProducts(api, projectName)
    const products = new ProductsPage(page)
    await openWithView(api, products, projectName, { conditions: [versionStatus('Approved')] })
    await expectSummaryToMatchVersionsList(products, ['renderA - v002'])
  })

  test('versions list filtered by reviewables', async ({ page, api, projectName }) => {
    const { approved } = await createProjectProducts(api, projectName)
    await api.uploadReviewable(projectName, approved.id, MEDIA.stillImage.path)
    const products = new ProductsPage(page)
    await openWithView(api, products, projectName, {
      conditions: [{ key: 'version_hasReviewables', value: ['true'], operator: 'in' }],
    })
    await expectSummaryToMatchVersionsList(products, ['renderA - v002'])
  })

  test('versions list of a folder selected in the hierarchy', async ({
    page,
    api,
    projectName,
  }) => {
    await createProjectProducts(api, projectName)
    const products = new ProductsPage(page)
    await openWithView(api, products, projectName)
    await new OverviewPage(page).toggleSidebarFolder('shots')
    await expectSummaryToMatchVersionsList(products, [
      'renderA - v001',
      'renderA - v002',
      'plateA - v001',
      'renderB - v001',
    ])
  })

  test('products view without filters', async ({ page, api, projectName }) => {
    await createProjectProducts(api, projectName)
    const products = new ProductsPage(page)
    await openWithView(api, products, projectName, { showProducts: true })
    await expectSummaryToMatchProductsView(products, {
      renderA: ['v001', 'v002'],
      plateA: ['v001'],
      renderB: ['v001'],
      modelA: ['v001', 'v002'],
    })
  })

  test('products view filtered by version status', async ({ page, api, projectName }) => {
    await createProjectProducts(api, projectName)
    const products = new ProductsPage(page)
    await openWithView(api, products, projectName, {
      showProducts: true,
      conditions: [versionStatus('Approved')],
    })
    await expectSummaryToMatchProductsView(products, { renderA: ['v002'] })
  })

  test('products view filtered by a list of folder names', async ({ page, api, projectName }) => {
    await createProjectProducts(api, projectName)
    const products = new ProductsPage(page)
    await openWithView(api, products, projectName, {
      showProducts: true,
      conditions: [folderName('sh020', 'hero')],
    })
    await expectSummaryToMatchProductsView(products, {
      renderB: ['v001'],
      modelA: ['v001', 'v002'],
    })
  })
})
