import { expect, test } from '@playwright/test'
import {
  hasUnqueriedFolders,
  markFoldersAsQueried,
  getCacheKey,
} from '../../shared/src/api/queries/overview/queriedFolders'
import { insertExtraColumns } from '../../shared/src/containers/ProjectTreeTable/utils/insertExtraColumns'

test('tables expanding different folders stop requesting once all their folders are loaded', () => {
  const projectName = 'tablesExpandingDifferentFolders'
  const tableA = { projectName, parentIds: ['a'] }
  const tableB = { projectName, parentIds: ['b'] }
  expect(hasUnqueriedFolders(tableA)).toBe(true)

  // both tables share one cache entry: its last args are B's, but A's folder is loaded
  markFoldersAsQueried(getCacheKey(projectName), ['a', 'b'])
  expect(hasUnqueriedFolders(tableA)).toBe(false)
  expect(hasUnqueriedFolders(tableB)).toBe(false)
  expect(hasUnqueriedFolders({ projectName, parentIds: ['a', 'c'] })).toBe(true)
})

test('folders loaded under one filter are not loaded under another', () => {
  const projectName = 'filteredFolders'
  markFoldersAsQueried(getCacheKey(projectName), ['a'])
  expect(hasUnqueriedFolders({ projectName, parentIds: ['a'], filter: 'x' })).toBe(true)
})

test('adding extra columns keeps the other column definitions, so their cells stay mounted', () => {
  const name = { id: 'name' }
  const status = { id: 'status' }
  const built = [name, status] as never[]
  const extra = { id: 'addon__a__b' }

  const columns = insertExtraColumns(built, [{ column: extra as never, after: 'name' }])

  expect(columns.map((c: { id: string }) => c.id)).toEqual(['name', 'addon__a__b', 'status'])
  expect(columns[0]).toBe(name)
  expect(columns[2]).toBe(status)
  expect(built).toEqual([name, status])
})
