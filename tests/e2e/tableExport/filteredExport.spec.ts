import { Locator, Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { ExportDialog } from '../pages/ExportDialog'
import { ListsPage } from '../pages/ListsPage'
import { OverviewPage } from '../pages/OverviewPage'
import { ProductsPage } from '../pages/ProductsPage'
import { AyonApi } from '../support/api'
import {
  applyFilterState,
  FilterData,
  FilterState,
  OVERVIEW_BASE_VIEW,
  OVERVIEW_STATES,
  REVIEW_SESSION_STATES,
  seedFilterData,
  TASK_LIST_STATES,
  VERSION_STATES,
  VERSIONS_BASE_VIEW,
} from '../support/filterStates'
import { requireTableExport } from './requireTableExport'

const sorted = (names: string[]) => [...names].sort()

// name cells hold icons and paths ("sh010/anim010", "render010 - v002"), exports the plain name
const tableName = (text: string) => {
  const version = text.match(/(\S+) - (v\d{3})/)
  if (version) return `${version[1]} ${version[2]}`
  return text.trim().split(/[\s/]/).pop() ?? ''
}

/**
 * Steps through filter states on one page: for each, the table shows the state's rows and the
 * whole-table export has the same ones.
 */
const checkStates = async (
  page: Page,
  options: Omit<Parameters<typeof applyFilterState>[1], 'data'> & {
    data: FilterData
    nameCells: Locator
  },
  states: FilterState[],
) => {
  const exportDialog = new ExportDialog(page)
  for (const state of states) {
    await test.step(state.title, async () => {
      await applyFilterState(page, options, state)

      await expect
        .poll(async () => sorted((await options.nameCells.allInnerTexts()).map(tableName)))
        .toEqual(sorted(state.rows))
      await exportDialog.openFromToolbar()
      const file = await exportDialog.export()
      expect(sorted(file.rows.slice(1).map((row) => row[0]))).toEqual(sorted(state.rows))
    })
  }
}

const createList = async (
  api: AyonApi,
  projectName: string,
  label: string,
  entityIds: string[],
  options: { entityType: string; entityListType?: string },
) => {
  const id = await api.createEntityList(projectName, { label, ...options })
  for (const entityId of entityIds) await api.addEntityListItem(projectName, id, entityId)
  return id
}

test.describe('filtered table export', () => {
  test.beforeEach(async ({ api }) => {
    await requireTableExport(api)
  })

  test('overview: the export has the rows of each filter', async ({ page, api, projectName }) => {
    test.slow()
    const data = await seedFilterData(api, projectName)
    const overview = new OverviewPage(page)
    await overview.goto(projectName)

    await checkStates(
      page,
      {
        api,
        projectName,
        viewType: 'overview',
        baseView: OVERVIEW_BASE_VIEW,
        data,
        goto: () => overview.goto(projectName),
        nameCells: overview.nameCells(),
      },
      OVERVIEW_STATES,
    )
  })

  test('products: the export has the versions of each filter', async ({
    page,
    api,
    projectName,
  }) => {
    test.slow()
    const data = await seedFilterData(api, projectName)
    const products = new ProductsPage(page)
    await products.goto(projectName)

    await checkStates(
      page,
      {
        api,
        projectName,
        viewType: 'versions',
        baseView: VERSIONS_BASE_VIEW,
        data,
        goto: () => products.goto(projectName),
        nameCells: products.table.locator('tbody td.name'),
      },
      VERSION_STATES,
    )
  })

  test('lists and review sessions: the export has the items of each filter', async ({
    page,
    api,
    projectName,
  }) => {
    test.slow()
    const data = await seedFilterData(api, projectName)
    await createList(api, projectName, 'Client picks', Object.values(data.tasks), {
      entityType: 'task',
    })
    await createList(api, projectName, 'Dailies', Object.values(data.versions), {
      entityType: 'version',
      entityListType: 'review-session',
    })
    const lists = new ListsPage(page)
    await lists.goto(projectName)

    await checkStates(
      page,
      {
        api,
        projectName,
        viewType: 'lists',
        data,
        goto: async () => {
          await lists.goto(projectName)
          await lists.openList('Client picks')
        },
        nameCells: lists.itemNameCells(),
      },
      TASK_LIST_STATES,
    )
    await checkStates(
      page,
      {
        api,
        projectName,
        viewType: 'reviews',
        // the table, the review page shows cards by default
        baseView: { displayStyle: 'table' },
        data,
        goto: async () => {
          await lists.goto(projectName, 'reviews')
          await lists.openList('Dailies')
        },
        nameCells: lists.itemNameCells(),
      },
      REVIEW_SESSION_STATES,
    )
  })
})
