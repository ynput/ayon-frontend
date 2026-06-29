import { useMemo } from 'react'
import { RowSelectionState } from '@tanstack/react-table'

interface UseSelectedFoldersProps {
  rowSelection: RowSelectionState
  sliceType: string
  rowSelectionData: Record<string, { id: string }> | null
  entityListFolderIds?: string[]
}

export const useSelectedFolders = ({
  rowSelection,
  sliceType,
  rowSelectionData,
  entityListFolderIds,
}: UseSelectedFoldersProps): string[] => {
  return useMemo(() => {
    // When entity list slice is active, use folder IDs directly (or empty array if none)
    if (sliceType === 'entityList') {
      return entityListFolderIds?.length ? entityListFolderIds : []
    }

    let selection: RowSelectionState = {}

    if (sliceType === 'hierarchy') {
      selection = rowSelection
    } else if (rowSelectionData) {
      selection = Object.values(rowSelectionData).reduce((acc: RowSelectionState, item) => {
        acc[item.id] = !!item
        return acc
      }, {})
    }

    // Process the selection inside useMemo
    return Object.entries(selection)
      .filter(([, value]) => value)
      .map(([id]) => id)
  }, [rowSelection, rowSelectionData, sliceType, entityListFolderIds])
}
