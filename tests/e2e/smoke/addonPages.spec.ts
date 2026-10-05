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

/**
 * Pages that addons add to the dashboard, to projects and to the studio settings open without
 * crashing, logging errors or failing API calls. Read-only.
 * They are optional: the pages are discovered from the navigation of the app, and a page whose addon
 * is not installed is skipped, so a stock server without these addons is not affected.
 */

const CORE_PAGES = [
  /^\/dashboard\/(tasks|projects|planner)$/,
  /^\/projects\/[^/]+\/(overview|tasks|browser|products|lists|reviews|scheduler|reports|workfiles)$/,
  /^\/settings\/(server|addons|bundles|studio|site|anatomyPresets|attributes|users|accessGroups|secrets)$/,
]

let navLinks: Promise<Set<string>> | undefined

/**
 * hrefs of the page tabs of the dashboard, of the seeded project and of the studio settings,
 * read once per worker with the first test's page
 */
const discoverNavLinks = (page: Page, d: SmokeData) =>
  (navLinks ??= (async () => {
    const links = new Set<string>()
    // each page renders its tabs once its addons and remote modules have loaded
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

/** Skips unless the navigation links to `path` */
const ifListed =
  (path: (d: SmokeData) => string) =>
  async ({ page, data }: SkipContext) =>
    !(await discoverNavLinks(page, data)).has(path(data)) &&
    `${path(data)} is not in the navigation (addon not installed)`

/** The planner addon replaces the core "Planner" splash on the dashboard with "Plan" */
const hasPlanner = async ({ page, data }: SkipContext) =>
  (await discoverNavLinks(page, data)).has('/dashboard/bookings')

/** The (only) iframe of a legacy addon page; FLAG: the iframe has no title or accessible name */
const addonFrame = (page: Page) => page.locator('main iframe').contentFrame()

const ROUTES: SmokeRoute[] = [
  // planner addon
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
  {
    name: 'project: schedule (planner)',
    path: projectPage('scheduler'),
    skip: async (context) => !(await hasPlanner(context)) && 'the planner addon is not installed',
    ready: (page) => visible(button(page, /^Today/), column(page, 'Folder / Task')),
    // FLAG (planner addon 2.3.0 bug): in a new project the schedule page asks for
    // `/api/addons/planner/2.3.0/events` and `/tracks` before the project's planner tables exist,
    // both fail with 500 `relation "planner_events" / "planner_tracks" does not exist`
    // (server/planner/api_planner_events.py:88, server/shared/api/tracks.py:37).
    fixme: 'planner 2.3.0: schedule of a new project fails with 500 (planner tables missing)',
  },
  // without the planner addon the core app shows splash screens in its place
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
  // review addon
  {
    name: 'project: review session (review)',
    // what "Open review" on the review page opens; a route the review addon adds
    path: (d) => `/projects/${d.projectName}/reviews/${d.reviewSession.id}`,
    skip: async ({ api }) =>
      !(await productionAddons(api)).includes('review') && 'the review addon is not installed',
    // the page crashes today, so this signal is a best guess: the player shows the session
    ready: (page, d) => visible(page.getByText(d.reviewSession.label).first()),
    // FLAG (review addon 0.7.5 bug): opening a review session without clips replaces the whole app
    // with "Something went wrong" (TypeError: Cannot read properties of undefined (reading 'context')).
    // The addon's useSelection reads `clips[current].context.productId` without checking that there
    // is a clip. A new session from "add" on the review page is empty, so this is the first thing
    // a user sees.
    fixme: 'review 0.7.5: opening an empty review session crashes the app',
  },
  // other addons
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
        // nothing is known about these pages, so "ready" is: its tab is the current one and the
        // page's requests have finished (expectHealthy waits for them)
        // FLAG: NavLink marks the current tab only with aria-current, which getByRole cannot match
        await visible(page.locator(`a[href="${href}"][aria-current="page"]`))
        await health.expectHealthy({ soft: true })
        health.stop()
      })
    }
  })
})
