// selects an entity and expands its parent folders
// mostly used when opening an entity via URI
// NOTE: currently only supports tasks, folders, products and versions

import { getCellId, ROW_SELECTION_COLUMN_ID } from '@shared/containers'
import { useProjectFoldersContext } from '@shared/context'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
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
  onExpandFolders?: (expanded: ExpandedState, selected: RowSelectionState) => void // callback when folders are expanded and selected (unique for each page)
  onSelection?: (selectedIds: string[], entityType: string) => void // callback when entity is selected
  onParentSelection?: (parentId: string) => void // callback when parent entity is selected
}

// return function to go to the entity
const useGoToEntity = ({
  page,
  onViewUpdate,
  onExpandFolders,
  onSelection,
  onParentSelection,
}: Props) => {
  // folders context with folders data with helper function
  const { getParentFolderIds } = useProjectFoldersContext()

  const goToEntity = useCallback<Value['goToEntity']>(
    (entityId, entityType, parents) => {
      // first if there is a callback to change the view, call it
      onViewUpdate?.()

      // helpers function to get expanded folders state
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

      // helper function to get selection with row selection cell
      const getTableSelection = (id: string) => {
        return [getCellId(id, 'name'), getCellId(id, ROW_SELECTION_COLUMN_ID)]
      }

      let selectionList: string[] = []
      let expandedFolders: ExpandedState = {}
      let selectedFolders: RowSelectionState = {}
      let folderId: string | undefined = parents.folder
      let parentId: string | undefined = undefined

      if (['folder', 'task'].includes(entityType) && parents.folder) {
        // for folders, the parentId is the folder itself
        folderId = entityType === 'folder' ? entityId : parents.folder
        parentId = folderId

        // OVERVIEW PAGE
        if (page === 'overview') {
          selectionList = getTableSelection(entityId)
        }

        // TASK PROGRESS PAGE
        if (page === 'progress') {
          selectionList = [entityId]
        }

        // TODO: lists page?
      }

      // version selection for products page
      if (entityType === 'version' && page === 'products') {
        // check we have a product and folder parent
        if (parents.product && parents.folder) {
          parentId = parents.product
          // expand parent product folder
          expandedFolders = getExpandedFolders(parents.folder)
          // set selection to version id
          selectionList = getTableSelection(entityId)
        }
      }

      // what folders are this entity in?
      if (folderId) {
        expandedFolders = getExpandedFolders(folderId)
        selectedFolders = { [folderId]: true }
        onExpandFolders?.(expandedFolders, selectedFolders)
      }

      // Call onSelection and onExpand at the end once
      if (selectionList.length) {
        onSelection?.(selectionList, entityType)
      }

      if (parentId) {
        onParentSelection?.(parentId)
      }
    },
    [onSelection, getParentFolderIds, onViewUpdate, onExpandFolders],
  )

  return { goToEntity }
}

export default useGoToEntity
