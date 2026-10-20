import { expect, test } from '@playwright/test'
import { resolveSliceSort, sortSliceRows } from '../../shared/src/containers/Slicer/util/sliceSort'

const row = (id: string, label: string, subRows: any[] = []) => ({
  id,
  label,
  subRows,
  data: { id },
})
const ids = (rows: { id: string }[]) => rows.map((r) => r.id)

test('an unknown saved sort falls back to the slice default', () => {
  expect(resolveSliceSort('status', { by: 'createdAt' })).toEqual({ by: 'default', desc: false })
})

test('rows sort by name, no value stays on top', () => {
  const rows = [row('noValue', 'No status'), row('b', 'banana'), row('a', 'Apple')]
  expect(ids(sortSliceRows(rows, 'status', { by: 'label', desc: false }))).toEqual([
    'noValue',
    'a',
    'b',
  ])
})

test('list folders keep their order, lists inside them are sorted', () => {
  const lists = [
    row('folder-1', 'Folder', [row('l2', 'beta'), row('l1', 'alpha')]),
    row('l3', 'zeta'),
  ]
  const sorted = sortSliceRows(lists, 'entityList', { by: 'label', desc: false })
  expect(ids(sorted)).toEqual(['folder-1', 'l3'])
  expect(ids(sorted[0].subRows)).toEqual(['l1', 'l2'])
})
