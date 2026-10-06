import { Page } from '@playwright/test'
import { watchPageHealth } from '../support/pageHealth'
import {
  button,
  column,
  defineRouteTests,
  expect,
  heading,
  productionAddons,
  SmokeData,
  SmokeRoute,
  test,
  visible,
} from './smokeFixtures'

const CORE_PAGES = [
  /^\/dashboard\/(tasks|projects|planner)$/,
  /^\/projects\/[^/]+\/(overview|tasks|browser|products|lists|reviews|scheduler|reports|workfiles)$/,
  /^\/settings\/(server|addons|bundles|studio|site|anatomyPresets|attributes|users|accessGroups|secrets)$/,
]

let navLinks: Promise<Set<string>> | undefined

const discoverNavLinks = (page: Page, d: SmokeData) =>
  (navLinks ??= (async () => {
    const links = new Set<string>()
    const pages: [string, RegExp][] = [
      ['/dashboard/tasks', /^Tasks/],
      [`/projects/${d.projectName}/overview`, /^Overview/],
      ['/settings/anatomyPresets', /^Anatomy presets/],
    ]
    for (const [path, firstTab] of pages) {
      await page.goto(path)
      await expect(page.getByRole('link', { name: firstTab })).toBeVisible({ timeout: 30_000 })
      const hrefs = await page
        .getByRole('link')
        .evaluateAll((all) => all.map((a) => a.getAttribute('href')))
      for (const href of hrefs) if (href) links.add(href)
    }
    return links
  })())

const projectPage = (module: string) => (d: SmokeData) => `/projects/${d.projectName}/${module}`

type SkipContext = { page: Page; data: SmokeData }

const ifListed =
  (path: (d: SmokeData) => string) =>
  async ({ page, data }: SkipContext) =>
    !(await discoverNavLinks(page, data)).has(path(data)) &&
    `${path(data)} is not in the navigation (addon not installed)`

const hasPlanner = async ({ page, data }: SkipContext) =>
  (await discoverNavLinks(page, data)).has('/dashboard/bookings')

// FLAG: the iframe of a legacy addon page has no title or accessible name
const addonFrame = (page: Page) => page.locator('main iframe').contentFrame()

const ROUTES: SmokeRoute[] = [
  {
    name: 'dashboard: plan (planner)',
    path: () => '/dashboard/bookings',
    skip: ifListed(() => '/dashboard/bookings'),
    ready: (page) => visible(button(page, /^Today/), button(page, 'Capacity')),
  },
  {
    name: 'dashboard: resources (planner)',
    path: () => '/dashboard/resources',
    skip: ifListed(() => '/dashboard/resources'),
    ready: (page) => visible(button(page, 'Create new resource')),
  },
  // FLAG (planner 2.3.0 bug): /events and /tracks fail with 500 until the project's planner tables exist
  {
    name: 'project: schedule (planner)',
    path: projectPage('scheduler'),
    skip: async (context) => !(await hasPlanner(context)) && 'the planner addon is not installed',
    ready: (page) => visible(button(page, /^Today/), column(page, 'Folder / Task')),
    fixme: 'planner 2.3.0: schedule of a new project fails with 500 (planner tables missing)',
  },
  {
    name: 'dashboard: planner splash (without the planner addon)',
    path: () => '/dashboard/planner',
    skip: ifListed(() => '/dashboard/planner'),
    ready: (page) => visible(heading(page, /Planner$/)),
  },
  {
    name: 'project: schedule splash (without the planner addon)',
    path: projectPage('scheduler'),
    skip: async (context) => (await hasPlanner(context)) && 'the planner addon is installed',
    ready: (page) => visible(heading(page, /Scheduler$/)),
  },
  // FLAG (review 0.7.5 bug): an empty review session crashes the app (useSelection expects a clip)
  {
    name: 'project: review session (review)',
    path: (d) => `/projects/${d.projectName}/reviews/${d.reviewSession.id}`,
    skip: async ({ api }) =>
      !(await productionAddons(api)).includes('review') && 'the review addon is not installed',
    // a best guess, the page crashes before it shows anything today
    ready: (page, d) => visible(page.getByText(d.reviewSession.label).first()),
    fixme: 'review 0.7.5: opening an empty review session crashes the app',
  },
  {
    name: 'project: storyboards',
    path: projectPage('storyboards'),
    skip: ifListed(projectPage('storyboards')),
    ready: (page) => visible(heading(page, 'Sequences')),
  },
  {
    name: 'project: archival tool',
    path: projectPage('addon/archival_tool'),
    skip: ifListed(projectPage('addon/archival_tool')),
    ready: (page) => visible(addonFrame(page).getByText('Report ID', { exact: true })),
  },
  {
    name: 'project: node graph',
    path: projectPage('addon/nodegraph'),
    skip: ifListed(projectPage('addon/nodegraph')),
    ready: (page) =>
      visible(addonFrame(page).getByText(/^Explore how everything in the project connects/)),
  },
]

test.describe('smoke: addon pages', () => {
  defineRouteTests(ROUTES)

  test('any other addon page', async ({ page, smoke }) => {
    const known = new Set(ROUTES.map((r) => r.path(smoke)))
    const others = [...(await discoverNavLinks(page, smoke))].filter(
      (href) =>
        /^\/(dashboard|projects|settings)\//.test(href) &&
        !known.has(href) &&
        !CORE_PAGES.some((core) => core.test(href)),
    )
    test.skip(!others.length, 'no other addon pages on this server')
    for (const href of others) {
      await test.step(href, async () => {
        const health = watchPageHealth(page)
        await page.goto(href)
        // FLAG: NavLink marks the current tab only with aria-current, which getByRole cannot match
        await visible(page.locator(`a[href="${href}"][aria-current="page"]`))
        await health.expectHealthy({ soft: true })
        health.stop()
      })
    }
  })
})
