import { expect, test } from '@playwright/test'
import { getOverviewTaskSource } from '../../shared/src/containers/ProjectTreeTable/utils/getOverviewTaskSource'

type Args = Parameters<typeof getOverviewTaskSource>[0]

const hierarchy: Args = {
  showHierarchy: true,
  isFlatFolderView: false,
  isGrouped: false,
  excludeSelectedFolders: true,
  hasSelectedFolders: false,
  hasTaskIds: false,
  isLoadingViews: false,
}
const flatList: Args = { ...hierarchy, showHierarchy: false }
const groupedByFolder: Args = { ...hierarchy, showHierarchy: false, isFlatFolderView: true }
const groupedByAttribute: Args = { ...hierarchy, showHierarchy: false, isGrouped: true }

test('hierarchy with an empty slicer loads tasks per expanded folder and never pages the whole project', () => {
  expect(getOverviewTaskSource(hierarchy)).toEqual({
    source: 'expandedFolders',
    skipTasksList: true,
  })
})

test('hierarchy with slicer folders lists the tasks directly under them next to expanded folders', () => {
  expect(getOverviewTaskSource({ ...hierarchy, hasSelectedFolders: true })).toEqual({
    source: 'expandedFoldersAndTasksList',
    skipTasksList: false,
  })
})

test('folders picked through a list panel are rows, their tasks load when expanded', () => {
  const result = getOverviewTaskSource({
    ...hierarchy,
    hasSelectedFolders: true,
    excludeSelectedFolders: false,
  })
  expect(result.source).toBe('expandedFolders')
  expect(result.skipTasksList).toBe(true)
})

test('grouping by folder loads tasks per expanded folder, even with slicer folders', () => {
  const result = getOverviewTaskSource({ ...groupedByFolder, hasSelectedFolders: true })
  expect(result.source).toBe('expandedFolders')
  expect(result.skipTasksList).toBe(true)
})

test('grouping by an attribute loads tasks per expanded group, not a flat list of the project', () => {
  const result = getOverviewTaskSource(groupedByAttribute)
  expect(result.source).toBe('groups')
  expect(result.skipTasksList).toBe(true)
})

test('without hierarchy or grouping the table pages through the tasks list', () => {
  const result = getOverviewTaskSource(flatList)
  expect(result.source).toBe('tasksList')
  expect(result.skipTasksList).toBe(false)
})

test('tasks of a selected entity list come from the tasks list in every view', () => {
  for (const view of [hierarchy, flatList, groupedByFolder, groupedByAttribute]) {
    const result = getOverviewTaskSource({ ...view, hasTaskIds: true, hasSelectedFolders: true })
    expect(result.source).toBe('tasksList')
    expect(result.skipTasksList).toBe(false)
  }
})

test('nothing is fetched while the view is still loading', () => {
  for (const view of [hierarchy, flatList, { ...hierarchy, hasTaskIds: true }]) {
    expect(getOverviewTaskSource({ ...view, isLoadingViews: true }).skipTasksList).toBe(true)
  }
})
