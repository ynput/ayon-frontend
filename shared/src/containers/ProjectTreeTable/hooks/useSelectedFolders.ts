import { useMemo } from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import { isEmpty } from 'lodash'

interface UseSelectedFoldersProps {
  rowSelection: RowSelectionState
  sliceType: string
  persistentRowSelectionData: Record<string, { id: string }> | null
}

export const useSelectedFolders = ({
  rowSelection,
  sliceType,
  persistentRowSelectionData,
}: UseSelectedFoldersProps): string[] => {
  if (isEmpty(persistentRowSelectionData)) return []

  return useMemo(() => {
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
  }, [rowSelection, persistentRowSelectionData, sliceType])
}
