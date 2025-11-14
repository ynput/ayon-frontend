// selects an entity and expands its parent folders
// mostly used when opening an entity via URI
// NOTE: currently only supports tasks, folders, products and versions

import { getCellId, ROW_SELECTION_COLUMN_ID, useSelectionCellsContext } from '@shared/containers'
import { useProjectFoldersContext } from '@shared/context'
import { ExpandedState } from '@tanstack/react-table'
import { useCallback } from 'react'

type Value = {
  goToEntity: (
    entityId: string,
    entityType: 'task' | 'version' | 'product' | 'folder',
    parents: {
      folder: string
      product: string
    },
  ) => void
}

type Props = {
  onViewUpdate?: () => void // do something to update the view before selecting
  onExpand?: (expanded: ExpandedState) => void // callback when folders are expanded (unique for each page)
}

// return function to go to the entity
const useGoToEntity = ({ onViewUpdate, onExpand }: Props) => {
  // folders context with folders data with helper function
  const { getParentFolderIds } = useProjectFoldersContext()
  //   table contexts
  const { setSelectedCells } = useSelectionCellsContext()

  const goToEntity = useCallback<Value['goToEntity']>(
    (entityId, entityType, parents) => {
      // first if there is a callback to change the view, call it
      if (onViewUpdate) {
        onViewUpdate()
      }

      // handle folders and tasks
      if (['folder', 'task'].includes(entityType)) {
        const selection = [
          getCellId(entityId, 'name'),
          getCellId(entityId, ROW_SELECTION_COLUMN_ID),
        ]

        setSelectedCells(new Set(selection))

        // determine folder ID
        const folderId = entityType === 'folder' ? entityId : parents.folder
        // get all parent folder IDs
        const parentFolderIds = getParentFolderIds(folderId)
        const expandingFolderIds =
          entityType === 'folder' ? parentFolderIds : [...parentFolderIds, folderId]
        const expandedFolderState = expandingFolderIds.reduce((acc, id) => {
          acc[id] = true
          return acc
        }, {} as Record<string, boolean>)

        // expand parent folders
        if (onExpand) {
          onExpand(expandedFolderState)
        }
      }
    },
    [setSelectedCells, getParentFolderIds, onViewUpdate, onExpand],
  )

  return { goToEntity }
}

export default useGoToEntity
