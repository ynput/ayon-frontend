import { expect, Page } from '@playwright/test'
import { AyonApi } from './api'

/**
 * Filter states for tests that need tables in different filtered states: one seeded project and,
 * per page, a varied set of filters (bar fields, parent scopes, attributes, AND/OR groups, excludes,
 * global search, the hierarchy slicer, latest per folder...) with the rows each one leaves.
 * Not every filter: a spread of the kinds that reach the server differently.
 *
 *   sq010 (Sequence, In progress)
 *     sh010 (Shot, Not ready)
 *       anim010 (Animation, In progress)
 *       comp010 (Compositing, Not ready, priority urgent)
 *       render010 v001 (Not ready, beauty)  v002 (Approved, beauty)
 *       model010  v001 (In progress, cache)
 *     sh020 (Shot, In progress)
 *       anim020 (Animation, Approved)
 *       lgt020 (Lighting, In progress, tag retake)
 *       render020 v001 (Not ready, beauty)  v002 (In progress, beauty), both from lgt020
 */
export const seedFilterData = async (api: AyonApi, projectName: string) => {
  const folder = async (name: string, folderType: string, status: string, parentId?: string) => {
    const created = await api.createFolder(projectName, { name, folderType, parentId })
    await api.updateFolder(projectName, created.id, { status })
    return created.id
  }
  const sq010 = await folder('sq010', 'Sequence', 'In progress')
  const sh010 = await folder('sh010', 'Shot', 'Not ready', sq010)
  const sh020 = await folder('sh020', 'Shot', 'In progress', sq010)

  const tasks: Record<string, string> = {}
  for (const [folderId, name, taskType, status, extra] of [
    [sh010, 'anim010', 'Animation', 'In progress', {}],
    [sh010, 'comp010', 'Compositing', 'Not ready', { attrib: { priority: 'urgent' } }],
    [sh020, 'anim020', 'Animation', 'Approved', {}],
    [sh020, 'lgt020', 'Lighting', 'In progress', { tags: ['retake'] }],
  ] as const) {
    const task = await api.createTask(projectName, { folderId, name, taskType, status, ...extra })
    tasks[name] = task.id
  }

  const versions: Record<string, string> = {}
  for (const [folderId, product, productType, representation, publishes, taskId] of [
    [sh010, 'render010', 'render', 'beauty', ['Not ready', 'Approved']],
    [sh010, 'model010', 'model', 'cache', ['In progress']],
    [sh020, 'render020', 'render', 'beauty', ['Not ready', 'In progress'], tasks.lgt020],
  ] as const) {
    const { id } = await api.createProduct(projectName, { folderId, name: product, productType })
    for (const [index, status] of publishes.entries()) {
      const version = await api.createVersion(projectName, {
        productId: id,
        version: index + 1,
        status,
        ...(taskId ? { taskId } : {}),
      })
      versions[versionName(product, index + 1)] = version.id
      const path = `{root[work]}/${projectName}/publish/${product}/v00${index + 1}/${product}.exr`
      await api.createRepresentation(projectName, {
        versionId: version.id,
        name: representation,
        files: [path],
        attrib: { path },
      })
    }
  }
  return { folders: { sq010, sh010, sh020 }, tasks, versions }
}

export type FilterData = Awaited<ReturnType<typeof seedFilterData>>

/** A version row as exports name it; the table shows "<product> - v001" */
export const versionName = (product: string, version: number) =>
  `${product} v${String(version).padStart(3, '0')}`

export type FilterState = {
  title: string
  /** working view settings, over the page's base settings */
  view?: Record<string, unknown>
  /** folders selected in the hierarchy slicer */
  slicerFolders?: string[]
  /** typed into the search bar and applied with Enter, through the UI */
  search?: string
  /** names of the rows left, as the first column of an export names them */
  rows: string[]
}

const filter = (...conditions: Record<string, unknown>[]) => ({
  filter: { conditions, operator: 'and' },
})

/** The overview as a flat task list, so every row is on screen */
export const OVERVIEW_BASE_VIEW = { showHierarchy: false }

export const OVERVIEW_STATES: FilterState[] = [
  { title: 'no filter', rows: ['anim010', 'comp010', 'anim020', 'lgt020'] },
  { title: 'global search typed in the bar', search: 'anim', rows: ['anim010', 'anim020'] },
  {
    title: 'task status',
    view: filter({ key: 'task_status', operator: 'in', value: ['In progress'] }),
    rows: ['anim010', 'lgt020'],
  },
  {
    title: 'task type and status (AND)',
    view: filter(
      { key: 'task_taskType', operator: 'in', value: ['Animation'] },
      { key: 'task_status', operator: 'in', value: ['Approved'] },
    ),
    rows: ['anim020'],
  },
  {
    title: 'task status or task type (OR group)',
    view: filter({
      operator: 'or',
      conditions: [
        { key: 'task_status', operator: 'in', value: ['Approved'] },
        { key: 'task_taskType', operator: 'in', value: ['Compositing'] },
      ],
    }),
    rows: ['comp010', 'anim020'],
  },
  {
    title: 'excluded task status',
    view: filter({ key: 'task_status', operator: 'notin', value: ['In progress'] }),
    rows: ['comp010', 'anim020'],
  },
  {
    title: 'parent folder status',
    view: filter({ key: 'folder_status', operator: 'in', value: ['Not ready'] }),
    rows: ['anim010', 'comp010'],
  },
  {
    title: 'task attribute',
    view: filter({ key: 'task_attrib.priority', operator: 'in', value: ['urgent'] }),
    rows: ['comp010'],
  },
  {
    title: 'task tags',
    view: filter({ key: 'task_tags', operator: 'includesany', value: ['retake'] }),
    rows: ['lgt020'],
  },
  { title: 'hierarchy slicer', slicerFolders: ['sh020'], rows: ['anim020', 'lgt020'] },
  {
    title: 'hierarchy slicer and task status',
    slicerFolders: ['sh010'],
    view: filter({ key: 'task_status', operator: 'in', value: ['Not ready'] }),
    rows: ['comp010'],
  },
]

/** The products page as a flat version list */
export const VERSIONS_BASE_VIEW = { showProducts: false }

const allVersions = [
  versionName('render010', 1),
  versionName('render010', 2),
  versionName('model010', 1),
  versionName('render020', 1),
  versionName('render020', 2),
]

export const VERSION_STATES: FilterState[] = [
  { title: 'no filter', rows: allVersions },
  {
    title: 'version status',
    view: filter({ key: 'version_status', operator: 'in', value: ['Approved'] }),
    rows: [versionName('render010', 2)],
  },
  {
    title: 'product type',
    view: filter({ key: 'version_productType', operator: 'in', value: ['model'] }),
    rows: [versionName('model010', 1)],
  },
  {
    title: 'product name typed',
    view: filter({ key: 'product_name', operator: 'like', value: '%020%' }),
    rows: [versionName('render020', 1), versionName('render020', 2)],
  },
  {
    title: 'parent folder status',
    view: filter({ key: 'folder_status', operator: 'in', value: ['Not ready'] }),
    rows: [versionName('render010', 1), versionName('render010', 2), versionName('model010', 1)],
  },
  {
    title: 'parent task type',
    view: filter({ key: 'task_taskType', operator: 'in', value: ['Lighting'] }),
    rows: [versionName('render020', 1), versionName('render020', 2)],
  },
  {
    title: 'representation name',
    view: filter({ key: 'representation_name', operator: 'like', value: '%cache%' }),
    rows: [versionName('model010', 1)],
  },
  {
    title: 'latest versions (featured)',
    view: filter({ key: 'version_version', operator: 'in', value: ['latest'] }),
    rows: [versionName('render010', 2), versionName('model010', 1), versionName('render020', 2)],
  },
  {
    title: 'latest per folder',
    view: { latestPerFolder: true },
    rows: [versionName('model010', 1), versionName('render020', 2)],
  },
  {
    title: 'version status and parent folder (AND) in the hierarchy slicer',
    slicerFolders: ['sh020'],
    view: filter({ key: 'version_status', operator: 'in', value: ['In progress'] }),
    rows: [versionName('render020', 2)],
  },
]

/** A task list with every seeded task, in that order */
export const TASK_LIST_STATES: FilterState[] = [
  { title: 'no filter', rows: ['anim010', 'comp010', 'anim020', 'lgt020'] },
  {
    title: 'global search',
    view: filter({ key: '--search--', operator: 'in', value: ['anim'] }),
    rows: ['anim010', 'anim020'],
  },
  {
    title: 'status',
    view: filter({ key: 'entity_status', operator: 'in', value: ['In progress'] }),
    rows: ['anim010', 'lgt020'],
  },
  {
    title: 'attribute',
    view: filter({ key: 'attrib.priority', operator: 'in', value: ['urgent'] }),
    rows: ['comp010'],
  },
]

/** A review session with every seeded version, in that order */
export const REVIEW_SESSION_STATES: FilterState[] = [
  { title: 'no filter', rows: allVersions },
  {
    title: 'version status',
    view: filter({ key: 'entity_status', operator: 'in', value: ['Not ready'] }),
    rows: [versionName('render010', 1), versionName('render020', 1)],
  },
]

const slicerKey = (projectName: string) => `slicer-selection-hierarchy-${projectName}`

/**
 * Put a page into a filter state: saves the working view (base settings and the state's), selects
 * the slicer folders, loads the page with `goto` and types the search.
 */
export const applyFilterState = async (
  page: Page,
  {
    api,
    projectName,
    viewType,
    baseView = {},
    data,
    goto,
  }: {
    api: AyonApi
    projectName: string
    viewType: 'overview' | 'versions' | 'lists' | 'reviews'
    baseView?: Record<string, unknown>
    data: FilterData
    goto: () => Promise<void>
  },
  state: FilterState,
) => {
  await api.setWorkingViewSettings(viewType, projectName, { ...baseView, ...state.view })
  // the slicer selection is kept in session storage, not in the view
  const selection = Object.fromEntries(
    (state.slicerFolders ?? []).map((name) => [
      data.folders[name as keyof FilterData['folders']],
      true,
    ]),
  )
  await page.evaluate(
    ([key, value]) =>
      value === '{}' ? sessionStorage.removeItem(key) : sessionStorage.setItem(key, value),
    [slicerKey(projectName), JSON.stringify(selection)] as const,
  )
  await goto()
  if (state.search) {
    const bar = page.locator('.search-filter')
    await bar.getByRole('textbox').click()
    await bar.locator('input:focus').fill(state.search)
    await page.keyboard.press('Enter')
    await expect(bar.locator('.search-filter-item')).toHaveCount(1)
  }
}
