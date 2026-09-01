import { expect, test } from 'vitest'
import { NO_MATCH_FOLDER_ID, resolveSlicerFolders, scopeIdsToFolders } from './resolveSlicerFolders'

const hierarchy = (...ids: string[]) => ({
  sliceType: 'hierarchy',
  rowSelection: Object.fromEntries(ids.map((id) => [id, true])),
})
const list = (...ids: string[]) => ({
  sliceType: 'entityList',
  rowSelection: Object.fromEntries(ids.map((id) => [id, true])),
})
const children: Record<string, string[]> = { f1: ['f1', 'f1a', 'f1b'], f2: ['f2'] }
const getChildFolderIds = (ids: string[]) => ids.flatMap((id) => children[id] ?? [id])

test('hierarchy alone returns its selected folders as scope roots', () => {
  const result = resolveSlicerFolders([hierarchy('f1', 'f2')])
  expect(result.selectedFolders).toEqual(['f1', 'f2'])
  expect(result.folderScope).toBe(null)
  expect(result.listPanelSelected).toBe(false)
})

test('deselected rows do not count as a selection', () => {
  const result = resolveSlicerFolders([
    { sliceType: 'hierarchy', rowSelection: { f1: true, f2: false } },
  ])
  expect(result.selectedFolders).toEqual(['f1'])
})

test('a list panel with nothing selected leaves the hierarchy in charge', () => {
  const result = resolveSlicerFolders([hierarchy('f1'), list()], ['f9'], getChildFolderIds)
  expect(result.listPanelSelected).toBe(false)
  expect(result.selectedFolders).toEqual(['f1'])
})

test('folder group rows in a list panel are not a selection', () => {
  const result = resolveSlicerFolders(
    [{ sliceType: 'entityList', rowSelection: { 'folder-f1': true } }],
    ['f1'],
    getChildFolderIds,
  )
  expect(result.listPanelSelected).toBe(false)
})

test('a list panel alone returns the list folders as results', () => {
  const result = resolveSlicerFolders([list('list1')], ['f1a', 'f9'], getChildFolderIds)
  expect(result.listPanelSelected).toBe(true)
  expect(result.selectedFolders).toEqual(['f1a', 'f9'])
  expect(result.folderScope).toBe(null)
})

test('hierarchy and list intersect on the hierarchy subtree', () => {
  const result = resolveSlicerFolders(
    [hierarchy('f1'), list('list1')],
    ['f1a', 'f9'],
    getChildFolderIds,
  )
  expect(result.selectedFolders).toEqual(['f1a'])
  expect([...result.folderScope!]).toEqual(['f1', 'f1a', 'f1b'])
})

test('a disjoint intersection yields no rows rather than the whole project', () => {
  const result = resolveSlicerFolders([hierarchy('f2'), list('list1')], ['f1a'], getChildFolderIds)
  expect(result.selectedFolders).toEqual([NO_MATCH_FOLDER_ID])
})

test('an empty list resolves to no rows when a hierarchy scope is set', () => {
  const result = resolveSlicerFolders([hierarchy('f1'), list('list1')], [], getChildFolderIds)
  expect(result.selectedFolders).toEqual([NO_MATCH_FOLDER_ID])
})

test('panel order does not matter', () => {
  const a = resolveSlicerFolders([hierarchy('f1'), list('l')], ['f1a'], getChildFolderIds)
  const b = resolveSlicerFolders([list('l'), hierarchy('f1')], ['f1a'], getChildFolderIds)
  expect(a.selectedFolders).toEqual(b.selectedFolders)
})

test('a list holding an ancestor keeps the deeper hierarchy selection', () => {
  const result = resolveSlicerFolders([hierarchy('f1a'), list('l')], ['f1'], getChildFolderIds)
  expect(result.selectedFolders).toEqual(['f1a'])
})

test('scoping leaves ids alone when there is no hierarchy scope', () => {
  expect(scopeIdsToFolders(['t1', 't2'], { t1: 'f1' }, null)).toEqual(['t1', 't2'])
})

test('scoping keeps ids inside the scope and ids with no known parent', () => {
  const scope = new Set(['f1'])
  expect(scopeIdsToFolders(['t1', 't2', 't3'], { t1: 'f1', t2: 'f2' }, scope)).toEqual(['t1', 't3'])
})

test('scoping everything away still restricts, it does not fall back to unfiltered', () => {
  const scope = new Set(['f1'])
  expect(scopeIdsToFolders(['t2'], { t2: 'f2' }, scope)).toEqual([NO_MATCH_FOLDER_ID])
})

test('an empty id list stays empty rather than becoming a restriction', () => {
  expect(scopeIdsToFolders([], {}, new Set(['f1']))).toEqual([])
})
