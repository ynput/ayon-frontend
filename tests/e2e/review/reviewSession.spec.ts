import { expect, test } from '../fixtures'
import { MEDIA } from '../media'
import { ListsPage } from '../pages/ListsPage'
import { ProductsPage } from '../pages/ProductsPage'
import { ViewerPage } from '../pages/ViewerPage'
import { AyonApi } from '../support/api'
import { dialog, menuItem, toast } from '../support/ui'
import { seedReviewVersions } from './seed'

const hasReviewAddon = async (api: AyonApi) => {
  const { addons } = await api.get('/api/addons')
  return addons.some((a: any) => a.name === 'review' && a.productionVersion)
}

const reviewSessions = async (api: AyonApi, projectName: string) => {
  const data = await api.graphql(
    `query Sessions($project: String!) {
      project(name: $project) {
        entityLists(first: 100) {
          edges { node { label entityListType entityType items(first: 100) { edges { node { id } } } } }
        }
      }
    }`,
    { project: projectName },
  )
  return data.project.entityLists.edges
    .map(({ node }: any) => node)
    .filter((list: any) => list.entityListType === 'review-session')
    .map((list: any) => ({
      label: list.label,
      entityType: list.entityType,
      entityIds: list.items.edges.map((e: any) => e.node.id).sort(),
    }))
}

test.describe('review sessions', () => {
  test.beforeEach(async ({ api }) => {
    test.skip(!(await hasReviewAddon(api)), 'the review addon is not installed')
  })

  test('create a review session from selected versions', async ({ page, api, projectName }) => {
    const {
      versions: [v1, v2],
    } = await seedReviewVersions(api, projectName, [
      [{ media: MEDIA.navyVideo }],
      [{ media: MEDIA.greenVideo }],
    ])
    const products = new ProductsPage(page)
    await products.goto(projectName)

    await products.cell('renderMain - v001', 'name').click()
    await products.cell('renderMain - v002', 'name').click({ modifiers: ['Shift'] })
    await products.cell('renderMain - v002', 'name').click({ button: 'right' })
    await menuItem(page, 'Review').hover()
    await menuItem(page, 'Create new session').click()
    const create = dialog(page, 'Create Review Session')
    await expect(create).toBeVisible()
    await create.getByLabel('Session label').fill('Dailies Monday')
    await create.getByRole('button', { name: 'Create session' }).click()

    await expect(toast(page, 'Dailies Monday')).toBeVisible()
    await expect
      .poll(() => reviewSessions(api, projectName))
      .toEqual([
        { label: 'Dailies Monday', entityType: 'version', entityIds: [v1.id, v2.id].sort() },
      ])
    const lists = new ListsPage(page)
    await page.goto(`/projects/${projectName}/reviews`)
    await expect(lists.listRow('Dailies Monday')).toBeVisible({ timeout: 30_000 })
  })

  test('open a version of a review session in the viewer', async ({ page, api, projectName }) => {
    const {
      versions: [v1, v2],
    } = await seedReviewVersions(api, projectName, [
      [{ media: MEDIA.navyVideo }],
      [{ media: MEDIA.greenVideo }],
    ])
    const listId = await api.createEntityList(projectName, {
      label: 'Client review',
      entityType: 'version',
      entityListType: 'review-session',
    })
    await api.addEntityListItem(projectName, listId, v1.id)
    await api.addEntityListItem(projectName, listId, v2.id)
    await page.goto(`/projects/${projectName}/reviews`)
    const lists = new ListsPage(page)
    await expect(lists.listRow('Client review')).toBeVisible({ timeout: 30_000 })
    await lists.listRow('Client review').click()
    // FLAG: the display style buttons are icon-only ("table_rows", "grid_view")
    await page.getByRole('button', { name: 'table_rows', exact: true }).click()
    await expect(lists.itemNameCell('v001')).toBeVisible()

    await lists.itemNameCell('v001').click({ button: 'right' })
    await menuItem(page, 'Open in viewer').click()

    const viewer = new ViewerPage(page)
    await viewer.expectVersion('v001')
    await viewer.expectVideo(v1.reviewables[0].fileId, MEDIA.navyVideo)

    await page.keyboard.press('ArrowDown')

    await viewer.expectVersion('v002')
    await viewer.expectVideo(v2.reviewables[0].fileId, MEDIA.greenVideo)
  })
})
