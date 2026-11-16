import type { RowSelectionState } from '@tanstack/react-table'

export interface SliceRowSelection {
  sliceType: string
  rowSelection: RowSelectionState
}

export interface SelectedFoldersResult {
  selectedFolders: string[]
  // hierarchy subtree (selected folders + descendants) used to narrow a list panel's ids
  folderScope: Set<string> | null
  listPanelSelected: boolean
}

// nonexistent id keeps the folder restriction alive when the selected lists are empty or
// disjoint from the hierarchy selection, so no folders yields no rows instead of all rows
export const NO_MATCH_FOLDER_ID = '0'.repeat(32)

// narrowing a non-empty id list down to nothing has to stay a restriction: handing back an
// empty array makes the query drop the id filter and return everything in scope
export const scopeIdsToFolders = (
  ids: string[],
  folderIdMap: Record<string, string>,
  folderScope: Set<string> | null,
): string[] => {
  if (!folderScope || !ids.length) return ids
  // ids not yet in the map pass through, it lags the raw ids by one resolve
  const scoped = ids.filter((id) => {
    const folderId = folderIdMap[id]
    return !folderId || folderScope.has(folderId)
  })
  return scoped.length ? scoped : [NO_MATCH_FOLDER_ID]
}

type GetChildFolderIds = (folderIds: string[], includeSelf?: boolean) => string[]

// intersect subtrees, not ids: either side may hold the ancestor, and the narrower
// side is the one that survives
const intersectFolderTrees = (
  a: string[],
  b: string[],
  getChildFolderIds?: GetChildFolderIds,
): string[] => {
  const aScope = new Set(getChildFolderIds && a.length ? getChildFolderIds(a, true) : a)
  const bScope = new Set(getChildFolderIds && b.length ? getChildFolderIds(b, true) : b)
  return [...new Set([...a.filter((id) => bScope.has(id)), ...b.filter((id) => aScope.has(id))])]
}

// searchFolderIds: the top-most folders the hierarchy panel search matches, null when
// there is no search. An active search restricts the table like a selection does.
export const resolveSlicerFolders = (
  slices: SliceRowSelection[],
  entityListFolderIds?: string[],
  getChildFolderIds?: GetChildFolderIds,
  searchFolderIds?: string[] | null,
): SelectedFoldersResult => {
  const hierarchyPanel = slices.find((slice) => slice.sliceType === 'hierarchy')
  const listPanel = slices.find((slice) => slice.sliceType === 'entityList')

  const selectedHierarchyIds = Object.entries(hierarchyPanel?.rowSelection || {})
    .filter(([, value]) => value)
    .map(([id]) => id)

  const isSearching = !!searchFolderIds
  const hierarchyIds = !searchFolderIds
    ? selectedHierarchyIds
    : selectedHierarchyIds.length
    ? intersectFolderTrees(selectedHierarchyIds, searchFolderIds, getChildFolderIds)
    : searchFolderIds

  const listPanelSelected =
    !!listPanel &&
    Object.entries(listPanel.rowSelection).some(([id, value]) => value && !id.startsWith('folder-'))

  if (!listPanelSelected) {
    return {
      // a search with no matches (or none under the selection) shows no rows, not all rows
      selectedFolders: isSearching && !hierarchyIds.length ? [NO_MATCH_FOLDER_ID] : hierarchyIds,
      folderScope: null,
      listPanelSelected: false,
    }
  }

  const listFolderIds = entityListFolderIds?.length ? entityListFolderIds : []
  // a search with no matches leaves an empty scope, so every list entity is scoped out
  const folderScope =
    (hierarchyIds.length || isSearching) && getChildFolderIds
      ? new Set(getChildFolderIds(hierarchyIds, true))
      : null

  const intersectedFolderIds = folderScope
    ? intersectFolderTrees(listFolderIds, hierarchyIds, getChildFolderIds)
    : listFolderIds

  // every list entity resolves to a folder, so no folders means the selected lists are
  // empty (or disjoint from the hierarchy) and nothing should match
  return {
    selectedFolders: intersectedFolderIds.length ? intersectedFolderIds : [NO_MATCH_FOLDER_ID],
    folderScope,
    listPanelSelected: true,
  }
}
