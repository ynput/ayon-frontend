import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'

/**
 * Filters from "Search and filter" are saved in the user's working view of the project, so each test
 * starts unfiltered in its own project (see "Per-user views" in tests/AGENTS.md).
 */

/** sh010 with tasks `[name, taskType, status]`, plus an empty folder "props" */
const createShot = async (api: AyonApi, projectName: string, tasks: [string, string, string][]) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  for (const [name, taskType, status] of tasks) {
    await api.createTask(projectName, { folderId: folder.id, name, taskType, status })
  }
  await api.createFolder(projectName, { name: 'props' })
  return folder
}

const savedFilter = (api: AyonApi, projectName: string) => async () =>
  (await api.getWorkingViewSettings('overview', projectName))?.filter?.conditions ?? []

test.describe('overview filters', () => {
  test('filter tasks by status', async ({ page, api, projectName }) => {
    await createShot(api, projectName, [
      ['anim', 'Animation', 'In progress'],
      ['comp', 'Compositing', 'Not ready'],
    ])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await expect(overview.row('props')).toBeVisible()

    await overview.addFilter('Task', 'Status', 'In progress')

    await expect(overview.filterChip('Task Status')).toContainText('In progress')
    // folders without matching tasks are hidden
    await expect(overview.row('props')).toBeHidden()
    await overview.expand('sh010')
    await expect(overview.row('anim')).toBeVisible()
    await expect(overview.row('comp')).toBeHidden()
    await expect
      .poll(savedFilter(api, projectName))
      .toEqual([{ key: 'task_status', value: ['In progress'], operator: 'in' }])
  })

  test('combine a status and a task type filter', async ({ page, api, projectName }) => {
    await createShot(api, projectName, [
      ['anim', 'Animation', 'In progress'],
      ['comp', 'Compositing', 'In progress'],
      ['fx', 'FX', 'Not ready'],
    ])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.addFilter('Task', 'Status', 'In progress')
    await overview.expand('sh010')
    await expect(overview.row('anim')).toBeVisible()

    await overview.addFilter('Task', 'Task Type', 'Compositing')

    await expect(overview.filterChip('Task Type')).toContainText('Compositing')
    await expect(overview.row('comp')).toBeVisible()
    await expect(overview.row('anim')).toBeHidden()
    await expect(overview.row('fx')).toBeHidden()
    await expect.poll(savedFilter(api, projectName)).toEqual([
      { key: 'task_status', value: ['In progress'], operator: 'in' },
      { key: 'task_taskType', value: ['Compositing'], operator: 'in' },
    ])
  })

  test('removing a filter shows all rows again', async ({ page, api, projectName }) => {
    await createShot(api, projectName, [
      ['anim', 'Animation', 'In progress'],
      ['comp', 'Compositing', 'Not ready'],
    ])
    await api.setWorkingViewSettings('overview', projectName, {
      filter: {
        operator: 'and',
        conditions: [{ key: 'task_status', value: ['In progress'], operator: 'in' }],
      },
    })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await expect(overview.filterChip('Task Status')).toContainText('In progress')
    await expect(overview.row('props')).toBeHidden()

    await overview.removeFilter('Task Status')

    await expect(overview.row('props')).toBeVisible()
    await overview.expand('sh010')
    await expect(overview.row('anim')).toBeVisible()
    await expect(overview.row('comp')).toBeVisible()
    await expect.poll(savedFilter(api, projectName)).toEqual([])
  })

  test('selecting a folder in the hierarchy sidebar shows only its content', async ({
    page,
    api,
    projectName,
  }) => {
    const sequence = await api.createFolder(projectName, { name: 'sq010', folderType: 'Sequence' })
    const shot = await api.createFolder(projectName, {
      name: 'sh010',
      folderType: 'Shot',
      parentId: sequence.id,
    })
    await api.createTask(projectName, { folderId: shot.id, name: 'anim', taskType: 'Animation' })
    await api.createFolder(projectName, { name: 'props' })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await expect(overview.row('props')).toBeVisible()

    await overview.toggleSidebarFolder('sq010')

    await expect(overview.nameCells()).toHaveText([/sh010$/])
    await overview.expand('sh010')
    await expect(overview.nameCells()).toHaveText([/sh010$/, /anim$/])

    // clicking it again shows everything
    await overview.toggleSidebarFolder('sq010')

    await expect(overview.row('props')).toBeVisible()
    await expect(overview.row('sq010')).toBeVisible()
  })
})
