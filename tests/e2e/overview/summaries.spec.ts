import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'
import { expandAllRows, readMainCount, rowLabels } from '../support/summary'

// shots/sq010/{sh010, sh020, sh030}, shots/sq020/sh040, assets/hero
const FOLDERS = ['shots', 'sq010', 'sh010', 'sh020', 'sh030', 'sq020', 'sh040', 'assets', 'hero']

const createProjectTree = async (api: AyonApi, projectName: string) => {
  const folder = async (name: string, folderType: string, parentId?: string) =>
    (await api.createFolder(projectName, { name, folderType, parentId })).id
  const task = (folderId: string, name: string, taskType: string, status: string) =>
    api.createTask(projectName, { folderId, name, taskType, status })

  const shots = await folder('shots', 'Folder')
  const sq010 = await folder('sq010', 'Sequence', shots)
  const sh010 = await folder('sh010', 'Shot', sq010)
  const sh020 = await folder('sh020', 'Shot', sq010)
  await folder('sh030', 'Shot', sq010)
  const sq020 = await folder('sq020', 'Sequence', shots)
  const sh040 = await folder('sh040', 'Shot', sq020)
  const assets = await folder('assets', 'Folder')
  const hero = await folder('hero', 'Asset', assets)

  await task(sh010, 'anim', 'Animation', 'In progress')
  await task(sh010, 'comp', 'Compositing', 'Not ready')
  await task(sh020, 'anim', 'Animation', 'Not ready')
  await task(sh040, 'anim', 'Animation', 'In progress')
  await task(hero, 'model', 'Modeling', 'Not ready')
}

const folderName = (...names: string[]) =>
  names.length === 1
    ? { key: 'folder_name', value: `%${names[0]}%`, operator: 'like' }
    : {
        operator: 'or',
        conditions: names.map((name) => ({
          key: 'folder_name',
          value: `%${name}%`,
          operator: 'like',
        })),
      }
const taskStatus = (status: string) => ({ key: 'task_status', value: [status], operator: 'in' })
const textSearch = (text: string) => ({ key: '--search--', value: [text], operator: 'in' })

const openWithView = async (
  api: AyonApi,
  overview: OverviewPage,
  projectName: string,
  { conditions = [], ...settings }: { conditions?: object[]; [key: string]: unknown } = {},
) => {
  await api.setWorkingViewSettings('overview', projectName, {
    ...settings,
    filter: { operator: 'and', conditions },
  })
  await overview.goto(projectName)
}

/**
 * Every folder and task row of the table data, collapsed parents included, matches the
 * summary footer. `folders` are the expected folder rows, `tasks` the number of task rows.
 */
const expectSummaryToMatchTable = async (
  overview: OverviewPage,
  expected: { folders: string[]; tasks: number },
  // the task list has no folder rows and its summary only counts tasks
  { taskRowsOnly = false } = {},
) => {
  const table = overview.table
  await expect
    .poll(async () => {
      await expandAllRows(table)
      const labels = await rowLabels(table)
      return {
        folders: labels.filter((label) => FOLDERS.includes(label)).sort(),
        tasks: labels.filter((label) => !FOLDERS.includes(label)).length,
      }
    })
    .toEqual({ folders: [...expected.folders].sort(), tasks: expected.tasks })

  await expect
    .poll(() => readMainCount(table))
    .toEqual(
      taskRowsOnly
        ? { task: expected.tasks }
        : { folder: expected.folders.length, task: expected.tasks },
    )
}

test.describe('overview summary matches the table', () => {
  test.beforeEach(async ({ api, projectName }) => {
    await createProjectTree(api, projectName)
  })

  test('without filters', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName)
    await expectSummaryToMatchTable(overview, { folders: FOLDERS, tasks: 5 })
  })

  test('filtered by one folder name', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, { conditions: [folderName('sh010')] })
    await expectSummaryToMatchTable(overview, { folders: ['shots', 'sq010', 'sh010'], tasks: 2 })
  })

  // ynput/ayon-frontend#2441: a list of shots in the filter bar
  test('filtered by a list of folder names', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, {
      conditions: [folderName('sh010', 'sh020', 'sh040')],
    })
    await expectSummaryToMatchTable(overview, {
      folders: ['shots', 'sq010', 'sh010', 'sh020', 'sq020', 'sh040'],
      tasks: 4,
    })
  })

  test('filtered by task status', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, { conditions: [taskStatus('In progress')] })
    await expectSummaryToMatchTable(overview, {
      folders: ['shots', 'sq010', 'sh010', 'sq020', 'sh040'],
      tasks: 2,
    })
  })

  test('filtered by folder names and task status', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, {
      conditions: [folderName('sh010', 'sh020'), taskStatus('In progress')],
    })
    await expectSummaryToMatchTable(overview, { folders: ['shots', 'sq010', 'sh010'], tasks: 1 })
  })

  test('text search for a folder without tasks', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, { conditions: [textSearch('sh030')] })
    await expectSummaryToMatchTable(overview, { folders: ['shots', 'sq010', 'sh030'], tasks: 0 })
  })

  test('text search for a task', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, { conditions: [textSearch('comp')] })
    await expectSummaryToMatchTable(overview, { folders: ['shots', 'sq010', 'sh010'], tasks: 1 })
  })

  test('folder selected in the hierarchy', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName)
    await overview.toggleSidebarFolder('shots')
    await expectSummaryToMatchTable(overview, {
      folders: ['sq010', 'sh010', 'sh020', 'sh030', 'sq020', 'sh040'],
      tasks: 4,
    })
  })

  test('folder selected in the hierarchy and a task filter', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, { conditions: [taskStatus('In progress')] })
    await overview.toggleSidebarFolder('shots')
    await expectSummaryToMatchTable(overview, {
      folders: ['sq010', 'sh010', 'sq020', 'sh040'],
      tasks: 2,
    })
  })

  test('folder selected in the hierarchy and a folder name filter', async ({
    page,
    api,
    projectName,
  }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, { conditions: [folderName('sh010', 'hero')] })
    await overview.toggleSidebarFolder('shots')
    await expectSummaryToMatchTable(overview, { folders: ['sq010', 'sh010'], tasks: 2 })
  })

  test('flat folders view', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, { showHierarchy: false, groupBy: 'folder' })
    await expectSummaryToMatchTable(overview, { folders: FOLDERS, tasks: 5 })
  })

  test('flat folders view filtered by task status', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, {
      showHierarchy: false,
      groupBy: 'folder',
      conditions: [taskStatus('In progress')],
    })
    await expectSummaryToMatchTable(overview, { folders: ['sh010', 'sh040'], tasks: 2 })
  })

  test('flat folders view filtered by a list of folder names', async ({
    page,
    api,
    projectName,
  }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, {
      showHierarchy: false,
      groupBy: 'folder',
      conditions: [folderName('sh010', 'sh030', 'sh040')],
    })
    await expectSummaryToMatchTable(overview, { folders: ['sh010', 'sh030', 'sh040'], tasks: 3 })
  })

  test('flat folders view searching for a folder without tasks', async ({
    page,
    api,
    projectName,
  }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, {
      showHierarchy: false,
      groupBy: 'folder',
      conditions: [textSearch('sh030')],
    })
    await expectSummaryToMatchTable(overview, { folders: ['sh030'], tasks: 0 })
  })

  test('flat folders view hiding empty folders', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, {
      showHierarchy: false,
      groupBy: 'folder',
      showEmptyGroups: false,
    })
    await expectSummaryToMatchTable(overview, {
      folders: ['sh010', 'sh020', 'sh040', 'hero'],
      tasks: 5,
    })
  })

  test('flat folders view hiding empty folders, filtered by folder names', async ({
    page,
    api,
    projectName,
  }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, {
      showHierarchy: false,
      groupBy: 'folder',
      showEmptyGroups: false,
      conditions: [folderName('sh010', 'sh030')],
    })
    await expectSummaryToMatchTable(overview, { folders: ['sh010'], tasks: 2 })
  })

  test('task list filtered by task status', async ({ page, api, projectName }) => {
    const overview = new OverviewPage(page)
    await openWithView(api, overview, projectName, {
      showHierarchy: false,
      conditions: [taskStatus('In progress')],
    })
    await expectSummaryToMatchTable(overview, { folders: [], tasks: 2 }, { taskRowsOnly: true })
  })
})
