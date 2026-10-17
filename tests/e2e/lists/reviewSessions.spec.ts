import { expect, test } from '../fixtures'
import { ListsPage } from '../pages/ListsPage'
import { dialog } from '../support/ui'

test.describe('review sessions', () => {
  test('filter the lists for a new session by all words of any comma separated part', async ({
    page,
    api,
    projectName,
  }) => {
    test.skip(!(await api.hasAddon('review')), 'review sessions need the review addon')
    for (const label of ['Car dailies', 'Car paint red', 'Sky review'])
      await api.createEntityList(projectName, { label, entityType: 'version' })
    const reviews = new ListsPage(page)
    await reviews.goto(projectName, 'reviews')
    await reviews.addListButton.click()
    const lists = dialog(page, 'Select a version list to create a review session')
    await expect(lists.getByText('Sky review', { exact: true })).toBeVisible()

    await lists.getByPlaceholder('Filter lists...').fill('car red, sky')

    await expect(lists.getByText('Car dailies', { exact: true })).toBeHidden()
    await expect(lists.getByText('Car paint red', { exact: true })).toBeVisible()
    await expect(lists.getByText('Sky review', { exact: true })).toBeVisible()
  })
})
