import { expect, test } from '../fixtures'
import { MEDIA } from '../media'
import { DetailsPanel } from '../pages/DetailsPanel'
import { ProductsPage } from '../pages/ProductsPage'
import { ViewerPage } from '../pages/ViewerPage'
import { seedReviewVersions } from './seed'

test.describe('viewer', () => {
  test('a version opens in the viewer from the products page and its video plays', async ({
    page,
    api,
    projectName,
  }) => {
    const {
      versions: [v1],
    } = await seedReviewVersions(api, projectName, [[{ media: MEDIA.navyVideo }]])
    const products = new ProductsPage(page)
    await products.goto(projectName)

    await products.openInViewer('renderMain - v001')

    const viewer = new ViewerPage(page)
    await viewer.expectOpen()
    await viewer.expectVersion('v001')
    await viewer.expectVideo(v1.reviewables[0].fileId, MEDIA.navyVideo)
    await expect(viewer.totalFrames).toHaveValue(String(MEDIA.navyVideo.frames))

    // opened from a table, the video starts playing by itself
    await expect(viewer.control('pause')).toBeVisible()
    await viewer.pause()

    await viewer.control('skip_previous').click()
    await viewer.expectFrame(1)

    await viewer.control('play_arrow').click()
    await expect(viewer.control('pause')).toBeVisible()
    await expect.poll(async () => (await viewer.videoState()).currentTime).toBeGreaterThan(0.5)
    await viewer.pause()

    await page.keyboard.press('Escape')
    await expect(viewer.root).toBeHidden()
  })

  test('an image opens in the viewer from the version details panel', async ({
    page,
    api,
    projectName,
  }) => {
    const {
      versions: [v1],
    } = await seedReviewVersions(api, projectName, [[{ media: MEDIA.stillImage }]])
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await products.openDetails('renderMain - v001')
    const panel = new DetailsPanel(page)
    await panel.expectOpenFor('renderMain')

    await ViewerPage.openFromThumbnail(panel, v1.id)

    const viewer = new ViewerPage(page)
    await viewer.expectOpen()
    await viewer.expectVersion('v001')
    await viewer.expectImage(MEDIA.stillImage.fileName, MEDIA.stillImage)
    await expect(viewer.video).toHaveCount(0)
  })

  test('switch between the versions of a product', async ({ page, api, projectName }) => {
    const {
      versions: [v1, v2],
    } = await seedReviewVersions(api, projectName, [
      [{ media: MEDIA.navyVideo }],
      [{ media: MEDIA.greenVideo }],
    ])
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await products.openInViewer('renderMain - v001')
    const viewer = new ViewerPage(page)
    await viewer.expectVersion('v001')
    await viewer.expectVideo(v1.reviewables[0].fileId, MEDIA.navyVideo)

    await viewer.nextVersionButton.click()

    await viewer.expectVersion('v002')
    await viewer.expectVideo(v2.reviewables[0].fileId, MEDIA.greenVideo)
    await expect(viewer.nextVersionButton).toBeDisabled()

    // "A" is the shortcut of the previous version button
    await page.keyboard.press('a')

    await viewer.expectVersion('v001')
    await viewer.expectVideo(v1.reviewables[0].fileId, MEDIA.navyVideo)

    await viewer.selectVersion('v002')

    await viewer.expectVideo(v2.reviewables[0].fileId, MEDIA.greenVideo)
  })

  test('switch between the reviewables of a version', async ({ page, api, projectName }) => {
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
    await products.openInViewer('renderMain - v001')
    const viewer = new ViewerPage(page)
    await viewer.expectOpen()
    await expect(viewer.reviewableCards).toHaveCount(2)

    await viewer.reviewableCard(still.fileId).click()

    await expect(viewer.reviewableCard(still.fileId)).toHaveClass(/selected/)
    await viewer.expectImage('still', MEDIA.stillImage)
    await expect(viewer.video).toHaveCount(0)

    await viewer.reviewableCard(video.fileId).click()

    await expect(viewer.reviewableCard(video.fileId)).toHaveClass(/selected/)
    await viewer.expectVideo(video.fileId, MEDIA.navyVideo)
    await expect(viewer.image('still')).toHaveCount(0)

    // W and S step through the reviewables (and wrap around)
    await page.keyboard.press('s')

    await expect(viewer.reviewableCard(still.fileId)).toHaveClass(/selected/)
    await viewer.expectImage('still', MEDIA.stillImage)
  })

  test('play, pause and step frames with the keyboard', async ({ page, api, projectName }) => {
    const {
      versions: [v1],
    } = await seedReviewVersions(api, projectName, [[{ media: MEDIA.navyVideo }]])
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await products.openInViewer('renderMain - v001')
    const viewer = new ViewerPage(page)
    await viewer.expectVideo(v1.reviewables[0].fileId, MEDIA.navyVideo)
    await expect(viewer.control('pause')).toBeVisible()
    // see ViewerPage.pause: let it play a few frames before pausing
    await expect.poll(async () => (await viewer.videoState()).currentTime).toBeGreaterThan(0.2)

    // K (or Space) toggles playback
    await page.keyboard.press('k')
    await expect(viewer.control('play_arrow')).toBeVisible()
    await expect.poll(async () => (await viewer.videoState()).paused).toBe(true)
    await viewer.goToFrame(100)

    // the arrow keys step one frame, L five frames; each step starts from the frame the player
    // shows, so wait for it before the next key
    await page.keyboard.press('ArrowRight')
    await viewer.expectFrame(101)
    await page.keyboard.press('ArrowLeft')
    await viewer.expectFrame(100)
    await page.keyboard.press('ArrowLeft')
    await viewer.expectFrame(99)
    await page.keyboard.press('l')
    await viewer.expectFrame(104)

    await page.keyboard.press('k')
    await expect(viewer.control('pause')).toBeVisible()
    await expect.poll(async () => (await viewer.videoState()).paused).toBe(false)
  })

  // FLAG (app bug): Shift+A / Shift+D ("Go to Start" / "Go to End", advertised in the button
  // tooltips) also switch to the previous / next version. useReviewShortcuts lowercases the key
  // and ignores Shift, and both handlers listen on window, so the player's stopPropagation does
  // not stop the version shortcut.
  // fixed in ynput/ayon-frontend#2406, switch back to test() once it is merged
  test.fixme(
    'go to start and end with Shift+A / Shift+D keeps the version',
    async ({ page, api, projectName }) => {
      const {
        versions: [v1],
      } = await seedReviewVersions(api, projectName, [
        [{ media: MEDIA.navyVideo }],
        [{ media: MEDIA.greenVideo }],
      ])
      const products = new ProductsPage(page)
      await products.goto(projectName)
      await products.openInViewer('renderMain - v001')
      const viewer = new ViewerPage(page)
      await viewer.expectVersion('v001')
      await viewer.expectVideo(v1.reviewables[0].fileId, MEDIA.navyVideo)
      await viewer.pause()
      await viewer.goToFrame(120)

      await page.keyboard.press('Shift+D')

      await viewer.expectFrame(MEDIA.navyVideo.frames!)
      await viewer.expectVersion('v001')

      await page.keyboard.press('Shift+A')

      await viewer.expectFrame(1)
      await viewer.expectVersion('v001')
    },
  )
})
