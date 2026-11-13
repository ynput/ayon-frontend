import { expect, test } from '../fixtures'
import { ProductsPage } from '../pages/ProductsPage'
import { AyonApi } from '../support/api'

const GENERATIVE = 'generative|version|version'
const GENERATIVE_IN = 'link_generative_version_version_in'

const createVersions = async (api: AyonApi, projectName: string) => {
  const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const render = await api.createProduct(projectName, {
    folderId: shot.id,
    name: 'renderMain',
    productType: 'render',
  })
  const comp = await api.createProduct(projectName, {
    folderId: shot.id,
    name: 'compMain',
    productType: 'render',
  })
  const render1 = await api.createVersion(projectName, { productId: render.id, version: 1 })
  const render2 = await api.createVersion(projectName, { productId: render.id, version: 2 })
  const comp1 = await api.createVersion(projectName, { productId: comp.id, version: 1 })
  await api.setWorkingViewColumns('versions', projectName, ['name', GENERATIVE_IN])
  return { render1, render2, comp1 }
}

test.describe('product link columns', () => {
  test('a version link column shows its links and opens them in the cell editor', async ({
    page,
    api,
    projectName,
  }) => {
    const { render1, render2 } = await createVersions(api, projectName)
    await api.createLink(projectName, {
      linkType: GENERATIVE,
      input: render1.id,
      output: render2.id,
    })
    const products = new ProductsPage(page)

    await products.goto(projectName)

    const linkedCell = products.cell('renderMain - v002', GENERATIVE_IN)
    await expect(linkedCell).toContainText('v001', { timeout: 30_000 })
    await expect(products.cell('renderMain - v001', GENERATIVE_IN)).not.toContainText('v00')

    await linkedCell.dblclick()
    const editor = page.locator('.links-widget-popup')
    await expect(editor).toContainText('Generative links (in)')
    await expect(editor.locator('.label').filter({ hasText: 'v001' })).toBeVisible()
  })

  test('a link added from the cell editor is saved and shown in the cell', async ({
    page,
    api,
    projectName,
  }) => {
    const { render2, comp1 } = await createVersions(api, projectName)
    const products = new ProductsPage(page)
    await products.goto(projectName)
    const cell = products.cell('compMain - v001', GENERATIVE_IN)
    await expect(cell).toBeVisible({ timeout: 30_000 })

    await cell.dblclick()
    const editor = page.locator('.links-widget-popup')
    await editor.getByPlaceholder('Search versions...').fill('v002')
    // only renderMain has a second version
    await editor.locator('[tabindex="0"]').filter({ hasText: 'v002' }).first().click()

    await expect
      .poll(() => api.listLinkedIds(projectName, 'version', comp1.id, 'in'))
      .toEqual([render2.id])
    await page.keyboard.press('Escape')
    await expect(cell).toContainText('v002')
  })

  test('product link columns can be edited on product rows', async ({ page, api, projectName }) => {
    const productLinkColumn = 'product_link_related_product_product_out'
    await api.createLinkType(projectName, 'related|product|product')
    const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const render = await api.createProduct(projectName, { folderId: shot.id, name: 'renderMain' })
    const comp = await api.createProduct(projectName, { folderId: shot.id, name: 'compMain' })
    await api.createVersion(projectName, { productId: render.id, version: 1 })
    await api.createVersion(projectName, { productId: comp.id, version: 1 })
    await api.setWorkingViewSettings('versions', projectName, {
      showProducts: true,
      columns: [
        { name: 'name', visible: true },
        { name: productLinkColumn, visible: true },
      ],
    })
    const products = new ProductsPage(page)
    await products.goto(projectName)
    const cell = products.row('compMain').first().locator(`td.${productLinkColumn}`)
    await expect(cell).toBeVisible({ timeout: 30_000 })

    await cell.dblclick()
    const editor = page.locator('.links-widget-popup')
    await editor.getByPlaceholder('Search products...').fill('renderMain')
    await editor.locator('[tabindex="0"]').filter({ hasText: 'renderMain' }).first().click()

    await expect
      .poll(() => api.listLinkedIds(projectName, 'product', comp.id, 'out'))
      .toEqual([render.id])
    await page.keyboard.press('Escape')
    await expect(cell).toContainText('renderMain')
  })
})
