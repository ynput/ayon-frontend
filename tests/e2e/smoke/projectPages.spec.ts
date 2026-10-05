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

/**
 * Every core project page opens without crashing, logging errors or failing API calls, for a project
 * with a folder, a task, a product, a version and a list. Read-only.
 * Pages that addons add to a project are in addonPages.spec.ts.
 */

/** /projects/<project>/<module><query> of the seeded project */
const project =
  (module: string, query: (d: SmokeData) => string = () => '') =>
  (d: SmokeData) =>
    `/projects/${d.projectName}/${module}${query(d)}`

/** URL params that open the details panel of an entity (DetailsPanelContext) */
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
    {
      name: 'task progress',
      path: project('tasks'),
      // FLAG (app bug, intermittent): TasksProgressPage takes the project name from redux
      // (`state.project.name`), which ProjectPage only sets in an effect once the project addons
      // have loaded. When the page renders first, its queries run with `null`:
      // GET /api/projects/null, /api/projects/null/anatomy and GetKanbanProjectUsers with
      // projects [null] (src/pages/TasksProgressPage/TasksProgressPage.tsx:16). About 1 load in 10.
      fixme: 'task progress queries project "null" before ProjectPage sets the project name',
      ready: (page, d) =>
        visible(
          page.getByRole('button', { name: 'Expand all rows' }),
          // the hierarchy on the left lists the folder; the table waits for a folder to be picked
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
    {
      name: 'review',
      path: project('reviews'),
      // FLAG (app bug, intermittent, with the review addon): ProjectListsDetailsPanels calls the
      // review addon's `useReviewSessionCards` hook as soon as its own copy of that module has loaded
      // (ProjectListsDetailsPanels.tsx:84-86), while the page may still wrap it in the fallback
      // provider because `ReviewCardsProvider` loads separately (ProjectListsPage.tsx:324). The hook
      // then throws "useReviewSessionCardsContext must be used within a ReviewSessionCardsProvider"
      // and the error boundary replaces the app.
      fixme: 'review page crashes when the review cards hook loads before its provider',
      // the review sessions with the review addon, its splash screen without it
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
      // the charts with the reports addon, its splash screen without it
      ready: (page) => visible(button(page, 'Add chart').or(heading(page, /Reports & Insights$/))),
    },
    {
      name: 'workfiles',
      path: project('workfiles'),
      // FLAG (app bug, intermittent): the same race as "task progress": WorkfileDetail reads the
      // project from redux and asks for GET /api/projects/null/siteRoots before ProjectPage has set
      // it (src/pages/WorkfilesPage/WorkfileDetail.jsx:13,25).
      fixme: 'workfiles queries project "null" before ProjectPage sets the project name',
      ready: async (page, d) => {
        await visible(
          page.getByPlaceholder('Filter folders...'),
          new WorkfilesPage(page).row(d.folder.name),
        )
      },
    },
    {
      name: 'the project URL without a page opens the overview',
      path: (d) => `/projects/${d.projectName}`,
      // FLAG: there is no default page; ProjectPage renders nothing and only redirects to the
      // overview after a 5 s timeout (the "no valid page component" fallback)
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
    {
      name: 'task progress with the details of a task',
      // FLAG (app bug, intermittent): see "task progress" above
      fixme: 'task progress queries project "null" before ProjectPage sets the project name',
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
      // FLAG (app bug, with the review addon 0.7.5): the selected session renders review addon
      // modules in the addon's own redux store. There the nested `getEnumOptions.initiate()` of
      // `getUsersAssignee` fails and its `.unwrap()` resolves to undefined, so the query throws
      // "TypeError: Cannot read properties of undefined (reading 'error')" and the session has no
      // assignee options (shared/src/api/queries/users/getUsers.ts, getUsersAssignee).
      fixme: 'getUsersAssignee throws inside the review addon store (reading "error" of undefined)',
    },
  ])
})
