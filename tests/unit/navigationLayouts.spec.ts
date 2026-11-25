import { expect, test } from '@playwright/test'
import {
  arrangeItems,
  arrangeTabs,
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

test('a layout orders items within their section; unmentioned ones go at its end', () => {
  const items = [
    item('production', 'main'),
    item('reviews', 'review'),
    item('storyboards', 'review'),
    item('scheduler', 'plan'),
    item('time', 'plan'),
    item('reports', 'plan'),
  ]
  const layout = toNavLayout(
    { project: { items: { order: ['reports', 'storyboards'] } } },
    'project',
  )
  expect(ids(arrangeItems(items, layout))).toEqual([
    'production',
    'storyboards',
    'reviews',
    'reports',
    'scheduler',
    'time',
  ])
  expect(arrangeItems(items, {})).toBe(items)
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
