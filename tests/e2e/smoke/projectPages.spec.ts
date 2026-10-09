import { DetailsPanel } from '../pages/DetailsPanel'
import { ListsPage } from '../pages/ListsPage'
import { OverviewPage } from '../pages/OverviewPage'
import { ProductsPage } from '../pages/ProductsPage'
import { WorkfilesPage } from '../pages/WorkfilesPage'
import {
  button,
  defineRouteTests,
  expect,
  heading,
  productionAddons,
  SmokeData,
  test,
  visible,
} from './smokeFixtures'

const project =
  (module: string, query: (d: SmokeData) => string = () => '') =>
  (d: SmokeData) =>
    `/projects/${d.projectName}/${module}${query(d)}`

const details = (type: string, id: (d: SmokeData) => string) => (d: SmokeData) =>
  `?project=${d.projectName}&type=${type}&id=${id(d)}`

test.describe('smoke: project pages', () => {
  defineRouteTests([
    {
      name: 'overview',
      path: project('overview'),
      ready: async (page, d) => {
        await visible(new OverviewPage(page).row(d.folder.name))
      },
    },
    // FLAG (app bug, intermittent): TasksProgressPage can query project "null" before redux has the name
    {
      name: 'task progress',
      path: project('tasks'),
      fixme:
        'task progress queries project "null" before ProjectPage sets the project name (fixed in ynput/ayon-frontend#2418)',
      ready: (page, d) =>
        visible(
          page.getByRole('button', { name: 'Expand all rows' }),
          page.getByRole('table').first().getByText(d.folder.name, { exact: true }),
          heading(page, 'Select a folder to begin.'),
        ),
    },
    {
      name: 'products',
      path: project('products'),
      ready: async (page, d) => {
        await visible(new ProductsPage(page).row(d.product.name))
      },
    },
    {
      name: 'lists',
      path: project('lists'),
      ready: async (page, d) => {
        await visible(new ListsPage(page).listRow(d.list.label))
      },
    },
    // FLAG (app bug, intermittent, review addon): the review cards hook can load before its provider
    {
      name: 'review',
      path: project('reviews'),
      fixme:
        'review page crashes when the review cards hook loads before its provider (fixed in ynput/ayon-frontend#2419)',
      ready: (page) =>
        visible(
          heading(page, 'Start by selecting a review session.').or(
            heading(page, /Review Sessions$/),
          ),
        ),
    },
    {
      name: 'reports',
      path: project('reports'),
      ready: (page) => visible(button(page, 'Add chart').or(heading(page, /Reports & Insights$/))),
    },
    // FLAG (app bug, intermittent): the same race as "task progress", in WorkfileDetail
    {
      name: 'workfiles',
      path: project('workfiles'),
      fixme:
        'workfiles queries project "null" before ProjectPage sets the project name (fixed in ynput/ayon-frontend#2418)',
      ready: async (page, d) => {
        await visible(
          page.getByPlaceholder('Filter folders...'),
          new WorkfilesPage(page).row(d.folder.name),
        )
      },
    },
    // FLAG: there is no default page; ProjectPage redirects to the overview after a 5 s timeout
    {
      name: 'the project URL without a page opens the overview',
      path: (d) => `/projects/${d.projectName}`,
      ready: async (page, d) => {
        await expect(page).toHaveURL(new RegExp(`/projects/${d.projectName}/overview`), {
          timeout: 30_000,
        })
        await visible(new OverviewPage(page).row(d.folder.name))
      },
    },
  ])
})

test.describe('smoke: deep links', () => {
  defineRouteTests([
    {
      name: 'overview with the details of a folder',
      path: project(
        'overview',
        details('folder', (d) => d.folder.id),
      ),
      ready: async (page, d) => {
        await visible(new OverviewPage(page).table)
        await new DetailsPanel(page).expectOpenFor(d.folder.name)
      },
    },
    {
      name: 'overview with the details of a task',
      path: project(
        'overview',
        details('task', (d) => d.task.id),
      ),
      ready: async (page, d) => {
        await visible(new OverviewPage(page).table)
        await new DetailsPanel(page).expectOpenFor(d.task.name)
      },
    },
    // FLAG (app bug, intermittent): see "task progress" above
    {
      name: 'task progress with the details of a task',
      fixme:
        'task progress queries project "null" before ProjectPage sets the project name (fixed in ynput/ayon-frontend#2418)',
      path: project(
        'tasks',
        details('task', (d) => d.task.id),
      ),
      ready: async (page, d) => {
        await visible(page.getByRole('button', { name: 'Expand all rows' }))
        await new DetailsPanel(page).expectOpenFor(d.task.name)
      },
    },
    {
      name: 'products with the details of a version',
      path: project(
        'products',
        details('version', (d) => d.version.id),
      ),
      ready: async (page, d) => {
        await visible(new ProductsPage(page).row(d.product.name))
        await new DetailsPanel(page).expectOpenFor('v001')
      },
    },
    {
      name: 'dashboard with the details of a task',
      path: (d) => `/dashboard/tasks${details('task', (d) => d.task.id)(d)}`,
      ready: async (page, d) => {
        await visible(page.getByPlaceholder('Filter tasks...'))
        await new DetailsPanel(page).expectOpenFor(d.task.name)
      },
    },
    {
      name: 'lists with a list selected',
      path: project('lists', (d) => `?list=${d.list.id}`),
      ready: async (page, d) => {
        await visible(new ListsPage(page).itemNameCell(d.task.name))
      },
    },
    // FLAG (app bug, review addon 0.7.5): getUsersAssignee throws in the addon's own redux store
    {
      name: 'review with a session selected',
      path: project('reviews', (d) => `?review=${d.reviewSession.id}`),
      skip: async ({ api }) =>
        !(await productionAddons(api)).includes('review') && 'needs the review addon',
      ready: async (page, d) => {
        await visible(
          page.getByRole('heading', { name: d.reviewSession.label, level: 2 }),
          page.getByRole('link', { name: /Open review$/ }),
        )
      },
      fixme:
        'getUsersAssignee throws inside the review addon store (fixed in ynput/ayon-frontend#2419 and #2420)',
    },
  ])
})
