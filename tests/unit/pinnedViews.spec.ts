import { expect, test } from '@playwright/test'
import {
  getPins,
  movePin,
  pinnedViewPath,
  renamePin,
  repointPin,
  togglePin,
  visiblePins,
  withPins,
} from '../../src/containers/Navigation/layouts/pins'
import type { PinnedView } from '../../src/containers/Navigation/layouts/types'

const pin = (id: string, extra: Partial<PinnedView> = {}): PinnedView => ({
  id,
  viewType: 'overview',
  scope: 'studio',
  ...extra,
})
const ids = (pins: PinnedView[]) => pins.map((p) => p.id)

test('pinning adds a view at the end with where it is stored; pinning it again unpins it', () => {
  const studio = togglePin([], { id: 'a', label: 'A', viewType: 'overview', scope: 'studio' }, 'p1')
  expect(studio).toEqual([{ id: 'a', viewType: 'overview', scope: 'studio' }])
  const project = togglePin(
    studio,
    { id: 'b', label: 'B', viewType: 'lists', scope: 'project' },
    'p1',
  )
  expect(project[1]).toEqual({ id: 'b', viewType: 'lists', scope: 'project', projectName: 'p1' })
  expect(ids(togglePin(project, { id: 'a', label: 'A', viewType: 'overview' }, 'p1'))).toEqual([
    'b',
  ])
  // a view of a page that can't be pinned
  expect(togglePin([], { id: 'r', label: 'R', viewType: 'reviews' }, 'p1')).toEqual([])
})

test('a pin moves within the pins, renames, and repoints in place', () => {
  const pins = [pin('a'), pin('b'), pin('c')]
  expect(ids(movePin(pins, 'a', 1))).toEqual(['b', 'a', 'c'])
  expect(ids(movePin(pins, 'a', -1))).toEqual(['a', 'b', 'c'])
  expect(ids(movePin(pins, 'c', 1))).toEqual(['a', 'b', 'c'])
  expect(renamePin(pins, 'b', '  Lighting  ')[1].label).toBe('Lighting')
  expect(renamePin(renamePin(pins, 'b', 'X'), 'b', '  ')[1].label).toBeUndefined()
  expect(ids(repointPin(pins, 'b', pin('z')))).toEqual(['a', 'z', 'c'])
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

test('pins live in the layout next to what else it holds, and link to their page', () => {
  const layout = withPins({ version: 1, project: { pinned: [pin('a')] } }, [pin('b')])
  expect(ids(getPins(layout))).toEqual(['b'])
  expect(getPins(undefined)).toEqual([])
  expect(pinnedViewPath('p1', { id: 'x', viewType: 'versions' })).toBe(
    '/projects/p1/products?view=x',
  )
})
