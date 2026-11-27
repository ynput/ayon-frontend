import { expect, test } from '@playwright/test'
import {
  arrangeRail,
  arrangeTabs,
  entryItems,
  keepItems,
  promotedIds,
  trimDividers,
} from '../../src/containers/Navigation/arrange'
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

test('an arrangement of only some items orders them within their sections, dividers between', () => {
  const layout = { order: ['reports', 'storyboards'] }
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

test('an arrangement of the whole sidebar is its order: items and dividers anywhere', () => {
  const layout = {
    free: true,
    order: ['reports', 'production', 'divider:a', 'time', 'reviews', 'divider:b', 'gone'],
  }
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
  const layout = {
    free: true,
    order: ['divider:a', 'production', 'divider:b', 'reviews', 'divider:c', 'divider:d'],
  }
  const items = [item('production', 'main'), item('time', 'plan')]
  expect(railIds(trimDividers(arrangeRail(items, layout)))).toEqual([
    'production',
    'divider:b',
    'time',
  ])
})

test('an item the order does not mention places by every item, the hidden ones too', () => {
  // the sidebar places all the items the user can open, then leaves out the ones it hides:
  // a new Plan item goes after hidden Schedule, below the divider, as it shows while editing
  const layout = { free: true, order: ['reports', 'divider:a', 'scheduler'], hidden: ['scheduler'] }
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

test('an arrangement orders and hides tabs; an unmentioned pin follows its page, other tabs the end', () => {
  const tabs = [
    { name: 'Overview', module: 'overview' },
    { name: 'Lighting', module: 'overview', pinnedView: 'v1' },
    { name: 'Task progress', module: 'tasks' },
    { name: 'Products', module: 'products' },
    { name: 'Lists', module: 'lists' },
  ]
  const layout = { tabs: { production: { order: ['products', 'overview'], hidden: ['tasks'] } } }
  // the pin isn't mentioned: it follows Overview; Lists isn't either: at the end
  expect(ids(arrangeTabs(tabs, layout, 'production'))).toEqual([
    'Products',
    'Overview',
    'Lighting',
    'Lists',
  ])
  // a pin the layout places
  const placed = { tabs: { production: { order: ['view:v1', 'overview'] } } }
  expect(ids(arrangeTabs(tabs, placed, 'production')).slice(0, 2)).toEqual(['Lighting', 'Overview'])
  // another item's tabs are as they are
  expect(arrangeTabs(tabs, layout, 'reviews')).toBe(tabs)
})

test('the admin pages on the sidebar: the arrangement\'s, else Settings, Projects and Events', () => {
  expect(promotedIds({})).toEqual(['settings', 'projects', 'events'])
  expect(promotedIds({ promoted: ['bundles'] })).toEqual(['bundles'])
})

test('a group holds its items in its place; they are nowhere else, and a new item goes by its section', () => {
  const layout = {
    free: true,
    order: ['production', 'divider:a', 'folder:g', 'reports'],
    folders: { 'folder:g': { label: 'Review', items: ['storyboards', 'reviews', 'gone'] } },
  }
  const entries = arrangeRail(sidebar(), layout)
  // time and scheduler aren't mentioned: after the last entry of their section (plan: reports)
  expect(railIds(entries)).toEqual(['production', 'divider:a', 'folder:g', 'reports', 'scheduler', 'time'])
  expect(entries[2].folder?.items.map((i) => i.id)).toEqual(['storyboards', 'reviews'])
  expect(entryItems(entries).map((i) => i.id)).toEqual([
    'production',
    'storyboards',
    'reviews',
    'reports',
    'scheduler',
    'time',
  ])
  // a group whose items are all hidden goes; the divider still separates Overview from Reports
  const shown = trimDividers(keepItems(entries, (i) => !['storyboards', 'reviews'].includes(i.id)))
  expect(railIds(shown)).toEqual(['production', 'divider:a', 'reports', 'scheduler', 'time'])
  // a group is something a divider separates: one left after it stays
  const last = arrangeRail(sidebar(), { ...layout, order: ['folder:g', 'divider:a', 'reports'] })
  expect(railIds(trimDividers(last)).slice(0, 3)).toEqual(['folder:g', 'divider:a', 'reports'])
})

