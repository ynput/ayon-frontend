import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'

const workingView = (api: AyonApi, projectName: string) => () =>
  api.getWorkingViewSettings('overview', projectName)

const columnVisibility = (api: AyonApi, projectName: string, column: string) => async () =>
  (await workingView(api, projectName)())?.columns?.find((c: any) => c.name === column)?.visible

test.describe('overview table view', () => {
  test('show a hidden attribute column', async ({ page, api, projectName }) => {
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    await api.updateFolder(projectName, folder.id, { attrib: { fps: 24 } })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await expect(overview.columnHeader('attrib_fps')).toBeHidden()

    await overview.showColumn('FPS', 'Attributes')

    await expect(overview.columnHeader('attrib_fps')).toContainText('FPS')
    await expect(overview.cell('sh010', 'attrib_fps')).toHaveText('24')
    await expect.poll(columnVisibility(api, projectName, 'attrib_fps')).toBe(true)
  })

  test('hide a column from its header menu', async ({ page, api, projectName }) => {
    await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await expect(overview.columnHeader('attrib_priority')).toBeVisible()

    await overview.columnMenu('attrib_priority', 'Hide column')

    await expect(overview.columnHeader('attrib_priority')).toBeHidden()
    await expect(overview.columnHeader('status')).toBeVisible()
    await expect.poll(columnVisibility(api, projectName, 'attrib_priority')).toBe(false)
  })

  // FLAG (app bug): the first column change saves the columns in definition order, not the displayed order
  // fixed in ynput/ayon-frontend#2399, switch back to test() once it is merged
  test.fixme(
    'hiding a column keeps the order of the others',
    async ({ page, api, projectName }) => {
      await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
      const overview = new OverviewPage(page)
      await overview.goto(projectName)
      const before = await overview.columnIds()
      expect(before).toContain('attrib_priority')

      await overview.columnMenu('attrib_priority', 'Hide column')
      await expect.poll(columnVisibility(api, projectName, 'attrib_priority')).toBe(false)

      // the page briefly keeps the old order until the saved view comes back, so check after a reload
      await overview.goto(projectName)
      await expect(overview.columnHeader('status')).toBeVisible()
      await expect(overview.columnHeader('attrib_priority')).toBeHidden()
      expect(await overview.columnIds()).toEqual(before.filter((id) => id !== 'attrib_priority'))
    },
  )

  test('group tasks by status', async ({ page, api, projectName }) => {
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    for (const [name, status] of [
      ['anim', 'In progress'],
      ['comp', 'Not ready'],
      ['fx', 'In progress'],
    ]) {
      await api.createTask(projectName, { folderId: folder.id, name, taskType: 'Generic', status })
    }
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.groupBy('Status')

    await expect(overview.groupRow('In progress')).toContainText('2 (67%)')
    await expect(overview.groupRow('Not ready')).toContainText('1 (33%)')
    await expect.poll(async () => (await workingView(api, projectName)())?.groupBy).toBe('status')
    await overview.expand('In progress')
    await expect(overview.row('anim')).toBeVisible()
    await expect(overview.row('fx')).toBeVisible()
    await expect(overview.row('comp')).toBeHidden()
  })
})
