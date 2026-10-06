import { expect, test } from '../fixtures'
import { MEDIA } from '../media'
import { hasReviewAddon, ListsPage } from '../pages/ListsPage'
import { toast } from '../support/ui'
import { seedReviewVersions } from '../review/seed'

test.describe('list details', () => {
  test('archive a list', async ({ page, api, projectName }) => {
    const listId = await api.createEntityList(projectName, { label: 'Old picks' })
    await api.createEntityList(projectName, { label: 'Current picks' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openDetails('Old picks')

    // not uncheck(): the click handler calls preventDefault, so the box only flips after a re-render
    const active = lists.listField('Active').getByRole('checkbox')
    await active.click()
    await expect(active).not.toBeChecked()

    await expect.poll(async () => (await api.getEntityList(projectName, listId)).active).toBe(false)
    await expect(lists.listRow('Old picks')).toBeHidden()
    await expect(lists.listRow('Current picks')).toBeVisible()
    await lists.headerMenu('Show archived')
    await expect(lists.listRow('Old picks')).toContainText('(archived)')
  })

  test('search lists by label', async ({ page, api, projectName }) => {
    await api.createEntityList(projectName, { label: 'Monday picks' })
    await api.createEntityList(projectName, { label: 'Tuesday picks' })
    await api.createEntityList(projectName, { label: 'Client notes' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await expect(lists.listRow('Client notes')).toBeVisible()

    await lists.search('picks')

    await expect(lists.listRow('Monday picks')).toBeVisible()
    await expect(lists.listRow('Tuesday picks')).toBeVisible()
    await expect(lists.listRow('Client notes')).toBeHidden()
  })
})

test.describe('review from a list', () => {
  test.beforeEach(async ({ api }) => {
    test.skip(!(await hasReviewAddon(api)), 'review sessions need the review addon')
  })

  test('create a review session from a version list', async ({ page, api, projectName }) => {
    const {
      versions: [v1, v2],
    } = await seedReviewVersions(api, projectName, [
      [{ media: MEDIA.navyVideo }],
      [{ media: MEDIA.greenVideo }],
    ])
    const listId = await api.createEntityList(projectName, {
      label: 'Dailies',
      entityType: 'version',
    })
    await api.addEntityListItem(projectName, listId, v1.id)
    await api.addEntityListItem(projectName, listId, v2.id)
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.openList('Dailies')
    await expect(lists.itemNameCell('v002')).toBeVisible()

    await page.getByRole('button', { name: 'subscriptions Create review', exact: true }).click()

    await expect(toast(page, 'Review session created')).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/projects/${projectName}/reviews`))
    await expect(lists.listRow('Dailies (review)')).toBeVisible({ timeout: 30_000 })
    const sessions = (await api.listEntityLists(projectName)).filter((l) => l.id !== listId)
    expect(sessions).toEqual([
      {
        id: expect.any(String),
        label: 'Dailies (review)',
        entityType: 'version',
        entityIds: [v1.id, v2.id],
      },
    ])
  })
})
