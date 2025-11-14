// selects an entity and expands its parent folders
// mostly used when opening an entity via URI
// NOTE: currently only supports tasks, folders, products and versions

import { getCellId, ROW_SELECTION_COLUMN_ID } from '@shared/containers'
import { useProjectFoldersContext } from '@shared/context'
import { ExpandedState } from '@tanstack/react-table'
import { useCallback } from 'react'

type Value = {
  goToEntity: (
    entityId: string,
    entityType: 'task' | 'version' | 'product' | 'folder' | string,
    parents: {
      folder?: string
      product?: string
    },
  ) => void
}

type Props = {
  page: 'overview' | 'progress' | 'products' | 'lists'
  onViewUpdate?: () => void // do something to update the view before selecting
  onExpand?: (expanded: ExpandedState) => void // callback when folders are expanded (unique for each page)
  onSelection?: (selectedIds: string[], entityType: string) => void // callback when entity is selected
  onParentSelection?: (parentId: string) => void // callback when parent entity is selected
}

// return function to go to the entity
const useGoToEntity = ({ page, onViewUpdate, onExpand, onSelection, onParentSelection }: Props) => {
  // folders context with folders data with helper function
  const { getParentFolderIds } = useProjectFoldersContext()

  const goToEntity = useCallback<Value['goToEntity']>(
    (entityId, entityType, parents) => {
      // first if there is a callback to change the view, call it
      if (onViewUpdate) {
        onViewUpdate()
      }

      const getExpandedFolders = (folderId: string) => {
        // get all parent folder IDs
        const parentFolderIds = getParentFolderIds(folderId)
        const expandingFolderIds =
          entityType === 'folder' ? parentFolderIds : [...parentFolderIds, folderId]
        const expandedFolderState = expandingFolderIds.reduce((acc, id) => {
          acc[id] = true
          return acc
        }, {} as Record<string, boolean>)
        return expandedFolderState
      }

      let selectionList: string[] = []
      let expandedDict: ExpandedState = {}
      let parentId: string | undefined = undefined

      if (['folder', 'task'].includes(entityType) && parents.folder) {
        const folderId = entityType === 'folder' ? entityId : parents.folder
        parentId = folderId
        expandedDict = getExpandedFolders(folderId)

        if (page === 'overview') {
          selectionList = [
            getCellId(entityId, 'name'),
            getCellId(entityId, ROW_SELECTION_COLUMN_ID),
          ]
        }

        if (page === 'progress') {
          selectionList = [entityId]
        }
      }

      // Call onSelection and onExpand at the end once
      if (selectionList.length) {
        onSelection?.(selectionList, entityType)
      }
      if (Object.keys(expandedDict).length) {
        onExpand?.(expandedDict)
      }
      if (parentId) {
        // also select the parent folder if applicable
        onParentSelection?.(parentId)
      }
    },
    [onSelection, getParentFolderIds, onViewUpdate, onExpand],
  )

  return { goToEntity }
}

export default useGoToEntity
