import { expect, test } from '../fixtures'
import { MEDIA } from '../media'
import { DetailsPanel } from '../pages/DetailsPanel'
import { ProductsPage } from '../pages/ProductsPage'
import { ReviewablesTab } from '../pages/ReviewablesTab'
import { ViewerPage } from '../pages/ViewerPage'
import { seedReviewVersions } from '../review/seed'
import { confirmDialog, menuItem } from '../support/ui'

test.describe('version reviewables', () => {
  test('upload a video to a version from the viewer', async ({ page, api, projectName }) => {
    const {
      versions: [v1],
    } = await seedReviewVersions(api, projectName, [[]])
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await products.openInViewer('renderMain - v001')
    const viewer = new ViewerPage(page)
    await viewer.expectVersion('v001')
    await expect(
      viewer.root.getByRole('heading', { name: 'This version has no online reviewables.' }),
    ).toBeVisible()

    await viewer.uploadInput.setInputFiles(MEDIA.navyVideo.path)

    // the upload is probed on the server; the new file is playable straight away
    await expect
      .poll(async () =>
        (await api.listReviewables(projectName, v1.id)).map((r) => [r.filename, r.availability]),
      )
      .toEqual([[MEDIA.navyVideo.fileName, 'ready']])
    const [uploaded] = await api.listReviewables(projectName, v1.id)
    await viewer.expectVideo(uploaded.fileId, MEDIA.navyVideo)
    await expect(viewer.reviewableCard(uploaded.fileId)).toHaveClass(/selected/)
  })

  test('the files tab lists reviewables with their status', async ({ page, api, projectName }) => {
    const {
      versions: [v1],
    } = await seedReviewVersions(api, projectName, [
      [{ media: MEDIA.navyVideo, label: 'main' }, { media: MEDIA.unsupportedVideo }],
    ])
    const [playable, unsupported] = v1.reviewables
    expect([playable.availability, unsupported.availability]).toEqual([
      'ready',
      'conversionRequired',
    ])
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await products.openDetails('renderMain - v001')
    const panel = new DetailsPanel(page)
    await panel.expectOpenFor('renderMain')

    const files = new ReviewablesTab(panel)
    await files.open()

    await expect(files.card(playable.fileId)).toContainText('main')
    await expect(files.card(playable.fileId)).toContainText(MEDIA.navyVideo.fileName)
    await expect(files.card(unsupported.fileId)).toContainText(MEDIA.unsupportedVideo.fileName)
    await expect(files.card(unsupported.fileId)).toContainText('Unsupported - conversion required')
    await expect(files.cards).toHaveCount(2)
  })

  test('delete a reviewable from the files tab', async ({ page, api, projectName }) => {
    const {
      versions: [v1],
    } = await seedReviewVersions(api, projectName, [
      [
        { media: MEDIA.navyVideo, label: 'main' },
        { media: MEDIA.stillImage, label: 'still' },
      ],
    ])
    const [video, still] = v1.reviewables
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await products.openDetails('renderMain - v001')
    const panel = new DetailsPanel(page)
    await panel.expectOpenFor('renderMain')
    const files = new ReviewablesTab(panel)
    await files.open()
    await expect(files.card(still.fileId)).toBeVisible()

    await files.card(still.fileId).click({ button: 'right' })
    await menuItem(page, 'Delete').click()
    await confirmDialog(page).getByRole('button', { name: 'Delete' }).click()

    await expect(files.card(still.fileId)).toBeHidden()
    await expect(files.card(video.fileId)).toBeVisible()
    await expect
      .poll(async () => (await api.listReviewables(projectName, v1.id)).map((r) => r.fileId))
      .toEqual([video.fileId])
  })

  // FLAG (app bug): a version whose only reviewable cannot be played (conversionRequired) shows an
  // empty viewer. ViewerComponent only shows a placeholder when the version has no reviewables at
  // all and otherwise returns null; its "File not supported and needs conversion" message is
  // unreachable.
  test.fixme(
    'the viewer explains when a version has no playable reviewable',
    async ({ page, api, projectName }) => {
      await seedReviewVersions(api, projectName, [[{ media: MEDIA.unsupportedVideo }]])
      const products = new ProductsPage(page)
      await products.goto(projectName)
      await products.openInViewer('renderMain - v001')
      const viewer = new ViewerPage(page)
      await viewer.expectVersion('v001')

      await expect(viewer.root.getByText(/not supported|needs conversion/)).toBeVisible()
    },
  )
})
