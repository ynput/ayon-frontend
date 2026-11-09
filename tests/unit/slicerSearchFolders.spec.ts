import { expect, test } from '@playwright/test'
import { getSearchMatchedFolderIds } from '../../shared/src/util/searchTerms'
import {
  NO_MATCH_FOLDER_ID,
  resolveSlicerFolders,
} from '../../shared/src/containers/ProjectTreeTable/hooks/resolveSlicerFolders'

// assets/char, assets/prop, shots/sq010/shot010..shot040, shots/sq020/shot050
const FOLDERS = [
  { id: 'assets', name: 'assets' },
  { id: 'char', name: 'char', parentId: 'assets' },
  { id: 'prop', name: 'prop', parentId: 'assets' },
  { id: 'shots', name: 'shots' },
  { id: 'sq010', name: 'sq010', parentId: 'shots' },
  { id: 'shot010', name: 'shot010', parentId: 'sq010' },
  { id: 'shot020', name: 'shot020', parentId: 'sq010' },
  { id: 'shot030', name: 'shot030', parentId: 'sq010' },
  { id: 'shot040', name: 'shot040', parentId: 'sq010' },
  { id: 'sq020', name: 'sq020', label: 'Sequence 20', parentId: 'shots' },
  { id: 'shot050', name: 'shot050', parentId: 'sq020' },
]

const getChildFolderIds = (ids: string[], includeSelf?: boolean) => {
  const result = new Set(includeSelf ? ids : [])
  let frontier = ids
  while (frontier.length) {
    const children = FOLDERS.filter((f) => f.parentId && frontier.includes(f.parentId))
    children.forEach((f) => result.add(f.id))
    frontier = children.map((f) => f.id)
  }
  return [...result]
}

const sorted = (ids: string[] | null) => (ids ? [...ids].sort() : ids)
const hierarchy = (...ids: string[]) => ({
  sliceType: 'hierarchy',
  rowSelection: Object.fromEntries(ids.map((id) => [id, true])),
})
const lists = (...ids: string[]) => ({
  sliceType: 'entityList',
  rowSelection: Object.fromEntries(ids.map((id) => [id, true])),
})
const resolve = (selected: string[], query: string, listFolderIds?: string[]) =>
  sorted(
    resolveSlicerFolders(
      listFolderIds ? [hierarchy(...selected), lists('list1')] : [hierarchy(...selected)],
      listFolderIds,
      getChildFolderIds,
      getSearchMatchedFolderIds(FOLDERS, query),
    ).selectedFolders,
  )

test('search matches are the top-most matching folders', () => {
  expect(getSearchMatchedFolderIds(FOLDERS, '')).toBeNull()
  expect(getSearchMatchedFolderIds(FOLDERS, ' , ')).toBeNull()
  expect(sorted(getSearchMatchedFolderIds(FOLDERS, 'shot020, shot030, shot040'))).toEqual([
    'shot020',
    'shot030',
    'shot040',
  ])
  // sq010 matches, its shots match through their parent label and collapse into it
  expect(getSearchMatchedFolderIds(FOLDERS, 'sq010')).toEqual(['sq010'])
  // space is AND, matched through the parent label
  expect(sorted(getSearchMatchedFolderIds(FOLDERS, 'sequence 050'))).toEqual(['shot050'])
  expect(getSearchMatchedFolderIds(FOLDERS, 'nothing')).toEqual([])
})

test('a search restricts the table with no selection or a parent selected', () => {
  expect(resolve([], 'shot020, shot030, shot040')).toEqual(['shot020', 'shot030', 'shot040'])
  expect(resolve(['shots'], 'shot020, shot030, shot040')).toEqual([
    'shot020',
    'shot030',
    'shot040',
  ])
})

test('a selection inside or across the results narrows it further', () => {
  // one result clicked
  expect(resolve(['shot020'], 'shot020, shot030')).toEqual(['shot020'])
  // results in two trees, a folder of one tree selected
  expect(resolve(['assets'], 'char, shot020')).toEqual(['char'])
  // a child of a match
  expect(resolve(['shot020'], 'sq010')).toEqual(['shot020'])
})

test('no matches, or none under the selection, shows nothing', () => {
  expect(resolve([], 'nothing')).toEqual([NO_MATCH_FOLDER_ID])
  expect(resolve(['assets'], 'shot020')).toEqual([NO_MATCH_FOLDER_ID])
})

test('without a search the selection is used as before', () => {
  expect(resolve([], '')).toEqual([])
  expect(resolve(['shots'], '')).toEqual(['shots'])
})

test('a search combines with a selected list', () => {
  expect(resolve([], 'shot020, char', ['sq010'])).toEqual(['shot020'])
  expect(resolve([], 'prop', ['sq010'])).toEqual([NO_MATCH_FOLDER_ID])
  expect(resolve([], '', ['sq010'])).toEqual(['sq010'])
})
