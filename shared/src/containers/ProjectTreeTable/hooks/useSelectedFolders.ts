import { useMemo } from 'react'
import { RowSelectionState } from '@tanstack/react-table'

export interface SliceRowSelection {
  sliceType: string
  rowSelection: RowSelectionState
}

interface UseSelectedFoldersProps {
  slices: SliceRowSelection[]
  entityListFolderIds?: string[]
  getChildFolderIds?: (folderIds: string[], includeSelf?: boolean) => string[]
}

export interface SelectedFoldersResult {
  selectedFolders: string[]
  // hierarchy subtree (selected folders + descendants) used to narrow a list panel's ids
  folderScope: Set<string> | null
  listPanelSelected: boolean
}

// nonexistent id keeps the folder restriction alive when the hierarchy and list
// selections are disjoint, so the empty intersection yields no rows instead of all rows
export const NO_MATCH_FOLDER_ID = '00000000000000000000000000000000'

export const useSelectedFolders = ({
  slices,
  entityListFolderIds,
  getChildFolderIds,
}: UseSelectedFoldersProps): SelectedFoldersResult => {
  return useMemo(() => {
    const hierarchyPanel = slices.find((slice) => slice.sliceType === 'hierarchy')
    const listPanel = slices.find((slice) => slice.sliceType === 'entityList')

    const hierarchyIds = Object.entries(hierarchyPanel?.rowSelection || {})
      .filter(([, value]) => value)
      .map(([id]) => id)

    const listPanelSelected =
      !!listPanel &&
      Object.entries(listPanel.rowSelection).some(
        ([id, value]) => value && !id.startsWith('folder-'),
      )

    if (!listPanelSelected) {
      return { selectedFolders: hierarchyIds, folderScope: null, listPanelSelected: false }
    }

    const listFolderIds = entityListFolderIds?.length ? entityListFolderIds : []
    const folderScope =
      hierarchyIds.length && getChildFolderIds
        ? new Set(getChildFolderIds(hierarchyIds, true))
        : null

    const intersectedFolderIds = folderScope
      ? listFolderIds.filter((id) => folderScope.has(id))
      : listFolderIds

    return {
      selectedFolders:
        folderScope && !intersectedFolderIds.length ? [NO_MATCH_FOLDER_ID] : intersectedFolderIds,
      folderScope,
      listPanelSelected: true,
    }
  }, [slices, entityListFolderIds, getChildFolderIds])
}
