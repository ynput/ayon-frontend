import { useMemo } from 'react'
import { RowSelectionState } from '@tanstack/react-table'

interface UseSelectedFoldersProps {
  rowSelection: RowSelectionState
  sliceType: string
  persistentRowSelectionData: Record<string, { id: string }> | null
  entityListFolderIds?: string[]
}

export const useSelectedFolders = ({
  rowSelection,
  sliceType,
  persistentRowSelectionData,
  entityListFolderIds,
}: UseSelectedFoldersProps): string[] => {
  return useMemo(() => {
    // When entity list slice has folder IDs, use those directly
    if (sliceType === 'entityList' && entityListFolderIds?.length) {
      return entityListFolderIds
    }

    let selection: RowSelectionState = {}

    if (sliceType === 'hierarchy') {
      selection = rowSelection
    } else if (persistentRowSelectionData) {
      selection = Object.values(persistentRowSelectionData).reduce(
        (acc: RowSelectionState, item) => {
          acc[item.id] = !!item
          return acc
        },
        {},
      )
    }

    // Process the selection inside useMemo
    return Object.entries(selection)
      .filter(([, value]) => value)
      .map(([id]) => id)
  }, [rowSelection, persistentRowSelectionData, sliceType, entityListFolderIds])
}
