import path from 'path'
import { expect, test } from '../fixtures'
import { OverviewPage } from '../pages/OverviewPage'

/** sq100 > sh110 > layout, with folder/task types and statuses */
const HIERARCHY_CSV = path.join(__dirname, 'fixtures/hierarchy.csv')

test.describe('overview CSV import', () => {
  test('import folders and a task from a CSV file', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await overview.importCsv(HIERARCHY_CSV, { created: 3 })

    await expect
      .poll(async () =>
        (
          await api.listFolders(projectName)
        ).map((f) => ({
          path: f.path,
          folderType: f.folderType,
          status: f.status,
        })),
      )
      .toEqual([
        { path: 'sq100', folderType: 'Sequence', status: 'Not ready' },
        { path: 'sq100/sh110', folderType: 'Shot', status: 'In progress' },
      ])
    const shot = (await api.listFolders(projectName)).find((f) => f.name === 'sh110')
    expect(
      (await api.listTasks(projectName, shot.id)).map((t) => [t.name, t.taskType, t.status]),
    ).toEqual([['layout', 'Layout', 'Approved']])
    // the open table does not pick up imported folders (see the fixme below), a reload shows them
    await overview.goto(projectName)
    await overview.expand('sq100')
    await overview.expand('sh110')
    await expect(overview.cell('sh110', 'status')).toContainText('In progress')
    await expect(overview.cell('layout', 'status')).toContainText('Approved')
  })

  // FLAG (app bug): imported folders and tasks never show in the open overview, only after a
  // reload. The import's `entity.folder.created` / `entity.task.created` events carry this
  // client's sender id, so WebsocketContext ignores them as "my own messages", and the
  // `importData` mutation (src/services/dataImport/index.ts) only invalidates `overviewTask` and
  // `project` for hierarchy imports, not the folder list (`folder` LIST / `hierarchy`) that the
  // table and the hierarchy sidebar are built from.
  test.fixme(
    'imported folders show in the open overview without a reload',
    async ({ page, projectName }) => {
      const overview = new OverviewPage(page)
      await overview.goto(projectName)

      await overview.importCsv(HIERARCHY_CSV, { created: 3 })

      await expect(overview.row('sq100')).toBeVisible()
      await expect(overview.sidebar().getByText('sq100', { exact: true })).toBeVisible()
      await overview.expand('sq100')
      await overview.expand('sh110')
      await expect(overview.row('layout')).toBeVisible()
    },
  )
})
