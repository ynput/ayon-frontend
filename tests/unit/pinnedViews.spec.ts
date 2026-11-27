import { expect, test } from '@playwright/test'
import {
  applyDraft,
  pinnedViewPath,
  placePinnedTabs,
  samePageLink,
  visiblePins,
} from '../../src/containers/Navigation/pins/pins'
import type { PinnedView } from '../../src/containers/Navigation/pins/types'

const pin = (id: string, extra: Partial<PinnedView> = {}): PinnedView => ({
  id,
  viewType: 'overview',
  scope: 'studio',
  ...extra,
})

test('a tab shows only for a readable view, and a project view only in its project', () => {
  const pins = [
    pin('studio'),
    pin('here', { scope: 'project', projectName: 'p1' }),
    pin('elsewhere', { scope: 'project', projectName: 'p2' }),
    pin('unreadable'),
    pin('lists', { viewType: 'lists' }),
  ]
  const readable = {
    overview: [{ id: 'studio' }, { id: 'here' }, { id: 'elsewhere' }],
    lists: [{ id: 'lists' }],
  }
  expect(visiblePins(pins, readable, 'p1').map((v) => v.pin.id)).toEqual([
    'studio',
    'here',
    'lists',
  ])
  // a view type whose list hasn't loaded shows no tabs yet
  expect(visiblePins(pins, { overview: readable.overview }, 'p1').map((v) => v.pin.id)).toEqual([
    'studio',
    'here',
  ])
})

test('a pinned tab links to its page with the view', () => {
  expect(pinnedViewPath('p1', { id: 'x', viewType: 'versions' })).toBe(
    '/projects/p1/products?view=x',
  )
})

test('a draft keeps a cleared field through session storage', () => {
  const saved = { groupBy: 'status', showHierarchy: false } as any
  // what mergeDraft stores for "no grouping", after a JSON round trip
  const draft = JSON.parse(JSON.stringify({ groupBy: null, rowHeight: 40 }))
  expect(applyDraft(saved, draft)).toEqual({ showHierarchy: false, rowHeight: 40 })
  expect(applyDraft(saved, undefined)).toEqual(saved)
})

test("a pinned tab sits right after its page, after that page's earlier pins", () => {
  const tabs = [
    { name: 'Overview', module: 'overview' },
    { name: 'Task progress', module: 'tasks' },
    { name: 'Products', module: 'products' },
    { name: 'Lists', module: 'lists' },
  ]
  const pinned = [
    { name: 'Lighting', module: 'overview', pinnedView: '1' },
    { name: 'Delivery', module: 'products', pinnedView: '2' },
    { name: 'Comp', module: 'overview', pinnedView: '3' },
    { name: 'Elsewhere', module: 'browser', pinnedView: '4' },
  ]
  expect(placePinnedTabs(tabs, pinned).map((t) => t.name)).toEqual([
    'Overview',
    'Lighting',
    'Comp',
    'Task progress',
    'Products',
    'Delivery',
    'Lists',
    'Elsewhere',
  ])
})

test('a link to a tab of the open page keeps its open list, and nothing one-shot', () => {
  const here = '/projects/p1/lists'
  const search = '?list=L1&listItemId=I9&uri=ayon%2Bentity%3A%2F%2Fp1%2Fa'
  expect(samePageLink('/projects/p1/lists?view=V', here, search)).toBe(
    '/projects/p1/lists?view=V&list=L1',
  )
  expect(samePageLink('/projects/p1/lists', here, search)).toBe('/projects/p1/lists?list=L1')
  // another page keeps its own link
  expect(samePageLink('/projects/p1/overview?view=V', here, search)).toBe(
    '/projects/p1/overview?view=V',
  )
  expect(samePageLink('/projects/p1/reviews?view=V', '/projects/p1/reviews', '?review=R')).toBe(
    '/projects/p1/reviews?view=V&review=R',
  )
  // the same page reached with a trailing slash
  expect(samePageLink('/projects/p1/lists?view=V', '/projects/p1/lists/', '?list=L1')).toBe(
    '/projects/p1/lists?view=V&list=L1',
  )
})
