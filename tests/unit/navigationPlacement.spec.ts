import { expect, test } from '@playwright/test'
import { checkManifest } from '../../addon/src/validate'
import { placePages } from '../../src/containers/Navigation/placePages'
import type { PageEntry } from '../../src/containers/Navigation/placePages'
import { KNOWN_PROJECT_PAGES, KNOWN_STUDIO_PAGES } from '../../src/containers/Navigation/knownPages'
import {
  filterNavigation,
  findActiveItem,
  fitDocked,
  splitAdminItems,
  itemLandingPath,
  sortForSidebar,
} from '../../src/containers/Navigation/filterNavigation'
import type { NavItem } from '../../src/containers/Navigation/types'

const addon = { name: 'planner', version: '1.0.0', remote: 'planner' }
const loader = () => Promise.resolve({ default: () => null })
const page = (fields: object) => ({
  slot: 'studio.page',
  id: 'bookings',
  title: 'Plan',
  component: loader,
  ...fields,
})

const main = (): NavItem => ({
  id: 'my-work',
  label: 'My work',
  icon: 'person',
  section: 'main',
  tabs: [{ name: 'My tasks', path: '/dashboard/tasks', module: 'tasks' }],
})

const entry = (module: string, meta: PageEntry['meta'] = {}, name = module): PageEntry => ({
  id: `addon:planner/${module}`,
  addon: 'planner',
  meta,
  tab: { name, module, path: `/dashboard/${module}` },
})

test('page slots take the placement fields', () => {
  const { contributions, skipped } = checkManifest(addon, {
    contributes: [
      page({
        icon: 'event_note',
        section: 'plan',
        group: 'planner',
        groupTitle: 'Planner',
        order: 2,
        placement: 'sidebar',
      }),
    ],
  })
  expect(skipped).toEqual([])
  expect(contributions).toHaveLength(1)
})

test('page slots refuse placement fields they cannot use', () => {
  for (const fields of [
    { icon: 'Event Note' },
    { section: 'admin' },
    { placement: 'header' },
    { group: '1planner' },
    { order: '2' },
  ]) {
    const { contributions, skipped } = checkManifest(addon, { contributes: [page(fields)] })
    expect(contributions, JSON.stringify(fields)).toHaveLength(0)
    expect(skipped, JSON.stringify(fields)).toHaveLength(1)
  }
})

test('a page declaring placement tab becomes a tab of the first item', () => {
  const first = main()
  const items = placePages(first, [entry('budget', { placement: 'tab' })], {})
  expect(items).toEqual([])
  expect(first.tabs.map((tab) => tab.module)).toEqual(['tasks', 'budget'])
})

test('pages of one group are one item, with the group title and the first icon', () => {
  const items = placePages(
    main(),
    [
      entry('bookings', { group: 'planner', groupTitle: 'Planner', icon: 'event_note', section: 'plan' }),
      entry('time', { icon: 'timer', section: 'plan' }),
      entry('resources', { group: 'planner', icon: 'groups' }),
    ],
    {},
  )
  expect(items.map((item) => [item.id, item.label, item.icon, item.section])).toEqual([
    ['group:planner/planner', 'Planner', 'event_note', 'plan'],
    ['addon:planner/time', 'time', 'timer', 'plan'],
  ])
  expect(items[0].tabs.map((tab) => tab.module)).toEqual(['bookings', 'resources'])
})

test('order sorts the tabs in a group', () => {
  const [item] = placePages(
    main(),
    [
      entry('bookings', { group: 'planner', groupTitle: 'Planner', order: 2 }),
      entry('resources', { group: 'planner', order: 1 }),
    ],
    {},
  )
  expect(item.tabs.map((tab) => tab.module)).toEqual(['resources', 'bookings'])
})

test('known pages follow the built-in map, unknown ones go to other', () => {
  const items = placePages(
    main(),
    [entry('bookings', {}, 'Plan'), entry('resources', {}, 'Resources'), entry('invoices')],
    KNOWN_STUDIO_PAGES,
  )
  expect(items.map((item) => [item.id, item.label, item.icon, item.section])).toEqual([
    ['group:planner/planner', 'Planner', 'event_note', 'plan'],
    ['addon:planner/invoices', 'invoices', 'extension', 'other'],
  ])
})

test('what a page declares wins over the built-in map', () => {
  const [item] = placePages(
    main(),
    [entry('reports', { section: 'pipeline', icon: 'bar_chart' })],
    KNOWN_PROJECT_PAGES,
  )
  expect([item.section, item.icon]).toEqual(['pipeline', 'bar_chart'])
})

test('a page the built-in map renames gets the new name on its item and tab', () => {
  const [item] = placePages(
    main(),
    [{ id: 'classic:archival_tool', tab: { name: 'ArchivalTool', module: 'archival_tool', path: '/a' } }],
    KNOWN_PROJECT_PAGES,
  )
  expect([item.label, item.tabs[0].name, item.section]).toEqual(['Archival', 'Archival', 'pipeline'])
})

const item = (id: string, section: NavItem['section'], tabs: NavItem['tabs'], extra = {}): NavItem => ({
  id,
  label: id,
  icon: 'extension',
  section,
  tabs,
  ...extra,
})

test('the sidebar orders items by section, then order, then registry order', () => {
  const items = [
    item('other', 'other', []),
    item('time', 'plan', [], { order: 2 }),
    item('schedule', 'plan', []),
    item('reports', 'plan', [], { order: 1 }),
    item('production', 'main', []),
  ]
  expect(sortForSidebar(items).map((i) => i.id)).toEqual([
    'production',
    'reports',
    'time',
    'schedule',
    'other',
  ])
})

test('an item shows when the user can open one of its tabs', () => {
  const access = { manager: false, admin: false }
  const items = [
    item('settings', 'admin', [
      { name: 'Studio', path: '/settings/studio', accessLevels: ['manager'] },
      { name: 'Site', path: '/settings/site', accessLevels: [] },
    ]),
    item('events', 'admin', [{ name: 'Events', path: '/events', accessLevels: ['manager'] }]),
    item('browser', 'main', [{ name: 'Browser', path: '/b', enabled: false }]),
  ]
  expect(filterNavigation(items, access).map((i) => i.id)).toEqual(['settings'])
  expect(filterNavigation(items, access, { hidden: ['settings'] })).toEqual([])
  expect(itemLandingPath({ ...items[0], landing: 'studio' }, access)).toBe('/settings/site')
  expect(itemLandingPath(items[0], { manager: true, admin: false })).toBe('/settings/studio')
})

test('a disabled item shows without tabs, opens nothing and is never active', () => {
  const access = { manager: false, admin: false }
  const review = item('reviews', 'review', [], { disabled: 'Coming soon' })
  expect(filterNavigation([review], access)).toEqual([review])
  expect(filterNavigation([review], access, { hidden: ['reviews'] })).toEqual([])
  expect(itemLandingPath(review, access)).toBeUndefined()
  expect(findActiveItem([review], '/dashboard/reviews')).toBeUndefined()
})

test('the active item holds the path in a tab or a match prefix', () => {
  const items = [
    item('production', 'main', [{ path: '/projects/p/overview' }, { path: '/projects/p/products' }]),
    item('reviews', 'review', [{ path: '/projects/p/reviews' }]),
    item('projects', 'admin', [{ path: '/manageProjects/projectSettings' }], {
      match: ['/manageProjects'],
    }),
  ]
  expect(findActiveItem(items, '/projects/p/products')?.id).toBe('production')
  expect(findActiveItem(items, '/projects/p/reviews/abc')?.id).toBe('reviews')
  expect(findActiveItem(items, '/projects/p/reviewsX')).toBeUndefined()
  expect(findActiveItem(items, '/manageProjects/anatomy')?.id).toBe('projects')
})

test('a layout promotes admin items to the sidebar; the rest go in the Admin menu', () => {
  const items = ['settings', 'projects', 'events', 'services', 'market'].map((id) =>
    item(id, 'admin', [{ path: `/${id}` }]),
  )
  const ids = (list: NavItem[]) => list.map((i) => i.id)
  const defaults = splitAdminItems(items)
  expect(ids(defaults.docked)).toEqual(['settings', 'projects', 'events'])
  expect(ids(defaults.folded)).toEqual(['services', 'market'])
  // in the layout's order
  const promoted = splitAdminItems(items, { promoted: ['services', 'settings'] })
  expect(ids(promoted.docked)).toEqual(['services', 'settings'])
  expect(ids(promoted.folded)).toEqual(['projects', 'events', 'market'])
})

test('admin pages that do not fit go into the Admin menu from the bottom, the button counted', () => {
  const heights = { a: 40, b: 40, c: 40 }
  const fit = (space: number, menuShown = false) =>
    fitDocked({ ids: ['a', 'b', 'c'], heights, space, button: 40, menuShown })
  // divider 9, each page 40 + a 2px gap
  expect(fit(Infinity)).toBe(3)
  expect(fit(135)).toBe(3)
  // the menu shows anyway: its button needs room too
  expect(fit(135, true)).toBe(2)
  // a page that goes brings the button, as high as a page: one more goes
  expect(fit(134)).toBe(1)
  expect(fit(50)).toBe(0)
  // not measured yet: all stay
  expect(fitDocked({ ids: ['a', 'x'], heights, space: 10, button: 40, menuShown: true })).toBe(2)
  // no pages on the sidebar: none, whatever the room
  expect(fitDocked({ ids: [], heights, space: 5, button: 40, menuShown: true })).toBe(0)
})
