import { expect, test } from '../fixtures'
import { DetailsPanel } from '../pages/DetailsPanel'

test.describe('products', () => {
  test('published versions are listed with their product', async ({ page, api, projectName }) => {
    const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const render = await api.createProduct(projectName, {
      folderId: shot.id,
      name: 'renderMain',
      productType: 'render',
    })
    await api.createVersion(projectName, { productId: render.id, version: 1 })
    await api.createVersion(projectName, { productId: render.id, version: 2 })
    const model = await api.createProduct(projectName, {
      folderId: shot.id,
      name: 'modelMain',
      productType: 'model',
    })
    await api.createVersion(projectName, { productId: model.id, version: 1 })

    await page.goto(`/projects/${projectName}/products`)

    // the default view of a new project lists every version as a row
    await expect(page.getByRole('row').filter({ hasText: 'renderMain - v002' })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByRole('row').filter({ hasText: 'renderMain - v001' })).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: 'modelMain - v001' })).toBeVisible()
    await expect(page.getByRole('row').filter({ hasText: /Main - v\d{3}/ })).toHaveCount(3)
  })

  test('double clicking a product opens its details', async ({ page, api, projectName }) => {
    const shot = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const render = await api.createProduct(projectName, { folderId: shot.id, name: 'renderMain' })
    await api.createVersion(projectName, { productId: render.id, version: 1 })

    await page.goto(`/projects/${projectName}/products`)
    const renderRow = page.getByRole('row').filter({ hasText: 'renderMain' }).first()
    await expect(renderRow).toBeVisible({ timeout: 30_000 })
    await renderRow.getByText('renderMain').dblclick()

    await new DetailsPanel(page).expectOpenFor('renderMain')
  })
})
