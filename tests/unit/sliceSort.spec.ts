import { expect, test } from '@playwright/test'
import {
  getDefaultSliceSort,
  getSliceSortOptions,
  resolveSliceSort,
  sortSliceRows,
} from '../../shared/src/containers/Slicer/util/sliceSort'

const row = (
  id: string,
  label: string,
  data: Record<string, unknown> = {},
  subRows: any[] = [],
) => ({
  id,
  name: label,
  label,
  subRows,
  data: { id, ...data },
})
const ids = (rows: { id: string }[]) => rows.map((r) => r.id)

test('options per slice type', () => {
  expect(getSliceSortOptions('assignees').map((o) => o.label)).toEqual(['Name'])
  expect(getSliceSortOptions('status').map((o) => o.label)).toEqual(['Anatomy order', 'Name'])
  expect(getSliceSortOptions('attrib.priority').map((o) => o.label)).toEqual([
    'Attribute order',
    'Name',
  ])
  expect(getSliceSortOptions('entityList').map((o) => o.id)).toEqual([
    'label',
    'createdAt',
    'updatedAt',
  ])
  expect(getDefaultSliceSort('entityList')).toEqual({ by: 'createdAt', desc: true })
})

test('invalid stored sort falls back to the default', () => {
  expect(resolveSliceSort('status', { by: 'createdAt', desc: true })).toEqual({
    by: 'default',
    desc: false,
  })
  expect(resolveSliceSort('status', undefined)).toEqual({ by: 'default', desc: false })
  expect(resolveSliceSort('status', { by: 'label', desc: true })).toEqual({
    by: 'label',
    desc: true,
  })
})

const STATUSES = [
  row('noValue', 'No status'),
  row('b', 'banana'),
  row('c', 'Cherry'),
  row('a', 'apple'),
]

test('default order is left untouched', () => {
  const rows = STATUSES
  expect(sortSliceRows(rows, 'status', { by: 'default', desc: false })).toBe(rows)
})

test('anatomy order reversed keeps no value on top', () => {
  expect(ids(sortSliceRows(STATUSES, 'status', { by: 'default', desc: true }))).toEqual([
    'noValue',
    'a',
    'c',
    'b',
  ])
})

test('name sort is case insensitive in both directions', () => {
  expect(ids(sortSliceRows(STATUSES, 'status', { by: 'label', desc: false }))).toEqual([
    'noValue',
    'a',
    'b',
    'c',
  ])
  expect(ids(sortSliceRows(STATUSES, 'assignees', { by: 'label', desc: true }))).toEqual([
    'noValue',
    'c',
    'b',
    'a',
  ])
})

test('sub rows are sorted too', () => {
  const tree = [row('p', 'parent', {}, [row('y', 'y'), row('x', 'x')])]
  // hierarchy default is name ascending, so ask for descending to force a sort
  const sorted = sortSliceRows(tree, 'hierarchy', { by: 'label', desc: true })
  expect(ids(sorted[0].subRows)).toEqual(['y', 'x'])
  const asc = sortSliceRows(tree, 'type', { by: 'label', desc: false })
  expect(ids(asc[0].subRows)).toEqual(['x', 'y'])
})

test('lists: folders keep their order, lists sort inside them, archived last', () => {
  const lists = [
    row('folder-2', 'Zeta folder', {}, [
      row('l3', 'beta', { active: true, createdAt: '2026-01-03' }),
      row('l4', 'alpha', { active: true, createdAt: '2026-01-04' }),
    ]),
    row('folder-1', 'Alpha folder'),
    row('l1', 'old archived', { active: false, createdAt: '2026-01-05' }),
    row('l2', 'Banana', { active: true, createdAt: '2026-01-01', updatedAt: '2026-02-01' }),
    row('l5', 'apple', { active: true, createdAt: '2026-01-02' }),
  ]
  const byName = sortSliceRows(lists, 'entityList', { by: 'label', desc: false })
  expect(ids(byName)).toEqual(['folder-2', 'folder-1', 'l5', 'l2', 'l1'])
  expect(ids(byName[0].subRows)).toEqual(['l4', 'l3'])
  const byUpdated = sortSliceRows(lists, 'entityList', { by: 'updatedAt', desc: true })
  expect(ids(byUpdated)).toEqual(['folder-2', 'folder-1', 'l2', 'l5', 'l1'])
})
