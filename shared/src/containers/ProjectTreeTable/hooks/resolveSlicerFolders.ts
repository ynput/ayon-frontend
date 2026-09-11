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

// nonexistent id keeps the folder restriction alive when the hierarchy and list
// selections are disjoint, so the empty intersection yields no rows instead of all rows
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

export const resolveSlicerFolders = (
  slices: SliceRowSelection[],
  entityListFolderIds?: string[],
  getChildFolderIds?: (folderIds: string[], includeSelf?: boolean) => string[],
): SelectedFoldersResult => {
  const hierarchyPanel = slices.find((slice) => slice.sliceType === 'hierarchy')
  const listPanel = slices.find((slice) => slice.sliceType === 'entityList')

  const hierarchyIds = Object.entries(hierarchyPanel?.rowSelection || {})
    .filter(([, value]) => value)
    .map(([id]) => id)

  const listPanelSelected =
    !!listPanel &&
    Object.entries(listPanel.rowSelection).some(([id, value]) => value && !id.startsWith('folder-'))

  if (!listPanelSelected) {
    return { selectedFolders: hierarchyIds, folderScope: null, listPanelSelected: false }
  }

  const listFolderIds = entityListFolderIds?.length ? entityListFolderIds : []
  const folderScope =
    hierarchyIds.length && getChildFolderIds ? new Set(getChildFolderIds(hierarchyIds, true)) : null

  // intersect subtrees, not ids: either side may hold the ancestor, and the narrower
  // side is the one that survives
  let intersectedFolderIds = listFolderIds
  if (folderScope) {
    const listScope =
      getChildFolderIds && listFolderIds.length
        ? new Set(getChildFolderIds(listFolderIds, true))
        : new Set(listFolderIds)
    intersectedFolderIds = [
      ...new Set([
        ...listFolderIds.filter((id) => folderScope.has(id)),
        ...hierarchyIds.filter((id) => listScope.has(id)),
      ]),
    ]
  }

  return {
    selectedFolders:
      folderScope && !intersectedFolderIds.length ? [NO_MATCH_FOLDER_ID] : intersectedFolderIds,
    folderScope,
    listPanelSelected: true,
  }
}
