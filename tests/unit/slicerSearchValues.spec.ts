import { expect, test } from '@playwright/test'
import { getSearchMatchedRowIds } from '../../shared/src/util/searchTerms'
import { applySearchMatches } from '../../shared/src/containers/Slicer/util/applySearchMatches'

const row = (id: string, label: string, subRows: any[] = [], parents: string[] = []) => ({
  id,
  name: id,
  label,
  parents,
  subRows,
})

const STATUSES = [
  row('Approved', 'Approved'),
  row('Pending review', 'Pending review'),
  row('Pending changes', 'Pending changes'),
  row('In progress', 'In progress'),
]

test('a value search returns the rows it leaves', () => {
  expect(getSearchMatchedRowIds(STATUSES, '')).toBeNull()
  expect(getSearchMatchedRowIds(STATUSES, 'approved')).toEqual(['Approved'])
  expect(getSearchMatchedRowIds(STATUSES, 'pending')?.sort()).toEqual([
    'Pending changes',
    'Pending review',
  ])
  // comma is OR
  expect(getSearchMatchedRowIds(STATUSES, 'approved, in progress')?.sort()).toEqual([
    'Approved',
    'In progress',
  ])
  expect(getSearchMatchedRowIds(STATUSES, 'nothing')).toEqual([])
})

test('a value search matches nested rows through their parents', () => {
  const rows = [row('anim', 'Animation', [row('anim/block', 'Blocking', [], ['Animation'])])]
  expect(getSearchMatchedRowIds(rows, 'animation blocking')).toEqual(['anim/block'])
})

test('the rows a search leaves act as the selection', () => {
  // no selection: everything left is selected
  expect(applySearchMatches({}, ['Pending review', 'Pending changes'])).toEqual({
    'Pending review': true,
    'Pending changes': true,
  })
  // a selection inside the results narrows them
  expect(
    applySearchMatches({ 'Pending review': true }, ['Pending review', 'Pending changes']),
  ).toEqual({ 'Pending review': true })
  // a selection the search hides, or nothing left, selects nothing
  expect(applySearchMatches({ Approved: true }, ['Pending review'])).toBeNull()
  expect(applySearchMatches({}, [])).toBeNull()
  // deselected entries are not a selection
  expect(applySearchMatches({ Approved: false }, ['Pending review'])).toEqual({
    'Pending review': true,
  })
})
