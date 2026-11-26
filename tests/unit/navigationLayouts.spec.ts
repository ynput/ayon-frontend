import { expect, test } from '@playwright/test'
import {
  addDivider,
  applyEdits,
  arrangeRail,
  arrangeTabs,
  moveTabInRow,
  removeDivider,
  reorderItems,
  trimDividers,
  reorderPromoted,
  reorderTabs,
  replaceTabId,
  togglePromoted,
  resolveLayout,
  toNavLayout,
} from '../../src/containers/Navigation/layouts/applyLayout'
import type { NavItem } from '../../src/containers/Navigation/types'

const item = (id: string, section: NavItem['section']): NavItem => ({
  id,
  label: id,
  icon: 'x',
  section,
  tabs: [{ path: `/${id}` }],
})
const ids = (list: { id?: string; name?: string }[]) => list.map((x) => x.id ?? x.name)

const sidebar = () => [
  item('production', 'main'),
  item('reviews', 'review'),
  item('storyboards', 'review'),
  item('scheduler', 'plan'),
  item('time', 'plan'),
  item('reports', 'plan'),
]
const railIds = (entries: { id: string }[]) => entries.map((entry) => entry.id)

test('a layout not arranged by the user orders items within their sections, dividers between', () => {
  const layout = toNavLayout(
    { project: { items: { order: ['reports', 'storyboards'] } } },
    'project',
  )
  expect(railIds(arrangeRail(sidebar(), layout))).toEqual([
    'production',
    'divider:review',
    'storyboards',
    'reviews',
    'divider:plan',
    'reports',
    'scheduler',
    'time',
  ])
  expect(railIds(arrangeRail(sidebar(), {}))).toEqual([
    'production',
    'divider:review',
    'reviews',
    'storyboards',
    'divider:plan',
    'scheduler',
    'time',
    'reports',
  ])
})

test('a sidebar the user arranged is its order: items and dividers anywhere', () => {
  const layout = toNavLayout(
    {
      project: {
        items: {
          free: true,
          order: ['reports', 'production', 'divider:a', 'time', 'reviews', 'divider:b', 'gone'],
        },
      },
    },
    'project',
  )
  // an item it doesn't mention goes after the last one of its section; every divider stays (one
  // left at the end, after an item the user can't see, goes once trimmed)
  expect(railIds(arrangeRail(sidebar(), layout))).toEqual([
    'reports',
    'production',
    'divider:a',
    'time',
    'scheduler',
    'reviews',
    'storyboards',
    'divider:b',
  ])
  expect(railIds(trimDividers(arrangeRail(sidebar(), layout))).slice(-1)).toEqual(['storyboards'])
  // an item of a section it doesn't mention at all goes at the end
  expect(
    railIds(arrangeRail([...sidebar(), item('workfiles', 'pipeline')], layout)).slice(-1),
  ).toEqual(['workfiles'])
})

test('dividers that separate nothing go: at either end and next to another one', () => {
  const layout = toNavLayout(
    {
      project: {
        items: {
          free: true,
          order: ['divider:a', 'production', 'divider:b', 'reviews', 'divider:c', 'divider:d'],
        },
      },
    },
    'project',
  )
  const items = [item('production', 'main'), item('time', 'plan')]
  expect(railIds(trimDividers(arrangeRail(items, layout)))).toEqual([
    'production',
    'divider:b',
    'time',
  ])
})

test('an item the order does not mention places by every item, the hidden ones too', () => {
  // the sidebar places all the items the user can open, then leaves out the ones the layout hides:
  // a new Plan item goes after hidden Schedule, below the divider, as it shows while editing
  const layout = toNavLayout(
    {
      project: {
        items: { free: true, order: ['reports', 'divider:a', 'scheduler'], hidden: ['scheduler'] },
      },
    },
    'project',
  )
  const all = arrangeRail(
    [item('reports', 'main'), item('scheduler', 'plan'), item('planner', 'plan')],
    layout,
  )
  expect(railIds(all)).toEqual(['reports', 'divider:a', 'scheduler', 'planner'])
  expect(railIds(trimDividers(all.filter((entry) => entry.id !== 'scheduler')))).toEqual([
    'reports',
    'divider:a',
    'planner',
  ])
})

test("the first change to the sidebar keeps it as shown and makes it the user's", () => {
  const shown = railIds(arrangeRail(sidebar(), {}))
  const moved = reorderItems(undefined, 'project', shown, 'reports', 'production')
  expect(moved.project?.items).toEqual({
    free: true,
    order: [
      'reports',
      'production',
      'divider:review',
      'reviews',
      'storyboards',
      'divider:plan',
      'scheduler',
      'time',
    ],
  })
  // a divider is added at the end, and removed
  const added = addDivider(
    moved,
    'project',
    railIds(arrangeRail(sidebar(), toNavLayout(moved, 'project'))),
    'divider:new',
  )
  expect(added.project?.items?.order?.slice(-2)).toEqual(['time', 'divider:new'])
  const removed = removeDivider(added, 'project', added.project!.items!.order!, 'divider:review')
  expect(removed.project?.items?.order).not.toContain('divider:review')
  expect(removed.project?.items?.free).toBe(true)
})

test('a layout orders and hides tabs; an unmentioned pin follows its page, other tabs the end', () => {
  const tabs = [
    { name: 'Overview', module: 'overview' },
    { name: 'Lighting', module: 'overview', pinnedView: 'v1' },
    { name: 'Task progress', module: 'tasks' },
    { name: 'Products', module: 'products' },
    { name: 'Lists', module: 'lists' },
  ]
  const layout = toNavLayout(
    { project: { tabs: { production: { order: ['products', 'overview'], hidden: ['tasks'] } } } },
    'project',
  )
  // the pin isn't mentioned: it follows Overview; Lists isn't either: at the end
  expect(ids(arrangeTabs(tabs, layout, 'production'))).toEqual([
    'Products',
    'Overview',
    'Lighting',
    'Lists',
  ])
  // a pin the layout places
  const placed = toNavLayout(
    { project: { tabs: { production: { order: ['view:v1', 'overview'] } } } },
    'project',
  )
  expect(ids(arrangeTabs(tabs, placed, 'production')).slice(0, 2)).toEqual(['Lighting', 'Overview'])
  // another item's tabs are as they are
  expect(arrangeTabs(tabs, layout, 'reviews')).toBe(tabs)
})

test('the layout that applies: picked, project default, studio default, own, none', () => {
  const readable = ['mine', 'shared', 'proj']
  expect(
    resolveLayout({ picked: 'shared', projectDefault: 'proj', readable, own: 'mine' }),
  ).toEqual({
    source: 'picked',
    id: 'shared',
  })
  // a pick the user can't read any more is skipped
  expect(resolveLayout({ picked: 'gone', projectDefault: 'proj', readable })).toEqual({
    source: 'project',
    id: 'proj',
  })
  expect(resolveLayout({ projectDefault: 'secret', readable, studioDefault: 'base' })).toEqual({
    source: 'studio',
    id: 'base',
  })
  expect(resolveLayout({ readable, own: 'mine' })).toEqual({ source: 'own', id: 'mine' })
  expect(resolveLayout({ readable: [] })).toEqual({ source: 'none' })
})

test('a tab moves within the row as shown, and a pin keeps its place when its view changes', () => {
  const row = ['overview', 'view:a', 'versions', 'lists']
  const moved = moveTabInRow(
    { version: 1, studio: { items: { hidden: ['x'] } } },
    'project',
    'production',
    row,
    'view:a',
    1,
  )
  expect(moved.project?.tabs?.production?.order).toEqual([
    'overview',
    'versions',
    'view:a',
    'lists',
  ])
  // the other context is kept
  expect(moved.studio).toEqual({ items: { hidden: ['x'] } })
  // nothing past the row's ends
  expect(moveTabInRow(moved, 'project', 'production', row, 'overview', -1)).toEqual(moved)
  // a tab the row doesn't show (another project's pin) keeps its place
  const stored = {
    version: 1 as const,
    project: { tabs: { production: { order: ['view:x', 'overview', 'view:a', 'versions'] } } },
  }
  expect(
    moveTabInRow(stored, 'project', 'production', [...row], 'view:a', -1).project?.tabs?.production
      ?.order,
  ).toEqual(['view:x', 'view:a', 'overview', 'versions', 'lists'])

  const repointed = replaceTabId(moved, 'view:a', 'view:b')
  expect(repointed.project?.tabs?.production?.order).toEqual([
    'overview',
    'versions',
    'view:b',
    'lists',
  ])
  const removed = replaceTabId(
    { version: 1, project: { tabs: { production: { order: ['view:a'], hidden: ['view:a'] } } } },
    'view:a',
  )
  expect(removed.project?.tabs?.production).toEqual({ order: [], hidden: [] })
})

test('a drop puts a tab or item where another one is; what the row does not show keeps its place', () => {
  const stored = { version: 1 as const, project: { items: { order: ['gone', 'b'] } } }
  expect(reorderItems(stored, 'project', ['a', 'b', 'c'], 'c', 'a').project?.items?.order).toEqual([
    'c',
    'gone',
    'a',
    'b',
  ])
  expect(
    reorderTabs(undefined, 'studio', 'my-work', ['tasks', 'projects', 'view:x'], 'tasks', 'view:x')
      .studio?.tabs?.['my-work']?.order,
  ).toEqual(['projects', 'view:x', 'tasks'])
})

test('saving an edit takes its sidebar, tab rows, pins and admin pages', () => {
  const current = {
    version: 1 as const,
    promoted: ['bundles'],
    project: {
      items: { hidden: ['workfiles'] },
      pinned: [{ id: 'a', viewType: 'overview' as const }],
    },
  }
  const draft = {
    version: 1 as const,
    promoted: [],
    project: {
      items: { hidden: [] },
      tabs: { production: { hidden: ['lists'] } },
      pinned: [{ id: 'b', viewType: 'lists' as const }],
    },
  }
  const saved = applyEdits(current, draft)
  expect(saved.promoted).toEqual([])
  expect(saved.project?.items).toEqual({ hidden: [] })
  expect(saved.project?.tabs).toEqual({ production: { hidden: ['lists'] } })
  expect(saved.project?.pinned?.map((pin) => pin.id)).toEqual(['b'])
})

test('an admin page moves between the sidebar and the Admin menu, and orders on the sidebar', () => {
  const moved = togglePromoted({ version: 1 }, 'bundles')
  expect(moved.promoted).toEqual(['settings', 'projects', 'events', 'bundles'])
  expect(togglePromoted(moved, 'projects').promoted).toEqual(['settings', 'events', 'bundles'])
  expect(reorderPromoted(moved, 'bundles', 'settings').promoted).toEqual([
    'bundles',
    'settings',
    'projects',
    'events',
  ])
  // a page that isn't on the sidebar doesn't move
  expect(reorderPromoted(moved, 'market', 'settings')).toBe(moved)
})
