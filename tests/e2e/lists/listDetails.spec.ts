import { expect, test } from '../fixtures'
import { ListsPage } from '../pages/ListsPage'

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
