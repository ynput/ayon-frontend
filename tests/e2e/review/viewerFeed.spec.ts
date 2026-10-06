import { expect, test } from '../fixtures'
import { MEDIA } from '../media'
import { DetailsPanel } from '../pages/DetailsPanel'
import { ProductsPage } from '../pages/ProductsPage'
import { ViewerPage } from '../pages/ViewerPage'
import { AyonApi } from '../support/api'
import { seedReviewVersions } from './seed'

const versionComments = async (api: AyonApi, projectName: string, versionId: string) => {
  const data = await api.graphql(
    `query Comments($project: String!, $ids: [String!]!) {
      project(name: $project) {
        activities(entityIds: $ids, activityTypes: ["comment"], last: 100) {
          edges { node { body activityData } }
        }
      }
    }`,
    { project: projectName, ids: [versionId] },
  )
  return data.project.activities.edges.map(({ node }: any) => {
    const { startFrame, endFrame } = JSON.parse(node.activityData)
    return { body: node.body, startFrame, endFrame }
  })
}

test.describe('viewer feed', () => {
  test('comment on a version from the viewer', async ({ page, api, projectName }) => {
    const {
      versions: [v1],
    } = await seedReviewVersions(api, projectName, [[{ media: MEDIA.stillImage }]])
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await products.openInViewer('renderMain - v001')
    const viewer = new ViewerPage(page)
    await viewer.expectImage(MEDIA.stillImage.fileName, MEDIA.stillImage)

    await viewer.details.addComment('Bars are too saturated')

    await expect
      .poll(() => versionComments(api, projectName, v1.id))
      .toEqual([{ body: 'Bars are too saturated', startFrame: undefined, endFrame: undefined }])

    await viewer.close()
    await products.openDetails('renderMain - v001')
    const panel = new DetailsPanel(page)
    await panel.expectOpenFor('renderMain')
    await expect(panel.comment('Bars are too saturated')).toBeVisible()
  })

  test('link a comment to the current frame and jump back to it', async ({
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
    await viewer.expectVideo(v1.reviewables[0].fileId, MEDIA.navyVideo)
    await viewer.pause()
    await viewer.goToFrame(120)

    await viewer.commentOnCurrentFrame('Square jumps here')

    await expect(viewer.frameLinkChip('Square jumps here')).toHaveText(/120/)
    await expect
      .poll(() => versionComments(api, projectName, v1.id))
      .toEqual([{ body: 'Square jumps here', startFrame: 120, endFrame: 120 }])

    await viewer.control('skip_previous').click()
    await viewer.expectFrame(1)

    await viewer.frameLinkChip('Square jumps here').click()

    await viewer.expectFrame(120)
  })

  test('change the version status from the viewer', async ({ page, api, projectName }) => {
    const {
      versions: [v1],
    } = await seedReviewVersions(api, projectName, [[{ media: MEDIA.navyVideo }]])
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await products.openInViewer('renderMain - v001')
    const viewer = new ViewerPage(page)
    await viewer.expectVersion('v001')
    // autoplay starting closes open dropdowns, so let it start first
    await viewer.expectVideo(v1.reviewables[0].fileId, MEDIA.navyVideo)
    await expect(viewer.control('pause')).toBeVisible()

    await viewer.details.setStatus('Approved')

    await expect
      .poll(async () => (await api.getVersion(projectName, v1.id)).status)
      .toBe('Approved')
    await viewer.close()
    await expect(products.cell('renderMain - v001', 'status')).toContainText('Approved')
  })

  // FLAG (app bug): "Approved - <version>" is always "Approved - None" when a project page is opened directly
  // fixed in ynput/ayon-frontend#2407, switch back to test() once it is merged
  test.fixme('jump to the approved version in the viewer', async ({ page, api, projectName }) => {
    const {
      versions: [v1],
    } = await seedReviewVersions(api, projectName, [
      [{ media: MEDIA.navyVideo }],
      [{ media: MEDIA.greenVideo }],
    ])
    await api.patch(`/api/projects/${projectName}/versions/${v1.id}`, { status: 'Approved' })
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await products.openInViewer('renderMain - v002')
    const viewer = new ViewerPage(page)
    await viewer.expectVersion('v002')
    await expect(viewer.approvedVersionButton).toHaveText('Approved - v001')

    await viewer.approvedVersionButton.click()

    await viewer.expectVersion('v001')
    await viewer.expectVideo(v1.reviewables[0].fileId, MEDIA.navyVideo)
  })
})
