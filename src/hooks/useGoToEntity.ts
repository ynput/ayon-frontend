// Hook for navigating to and selecting entities
// Provides helper functions to expand folder hierarchies and prepare selection data
// The actual selection/expansion logic is handled by the consuming page

import { useProjectFoldersContext } from '@shared/context'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'

export type EntityType = 'task' | 'version' | 'product' | 'folder'

export type EntityParents = {
  folder?: string
  product?: string
}

export type GoToEntityData = {
  entityId: string
  entityType: EntityType
  parents: EntityParents
  expandedFolders: ExpandedState
  selectedFolders: RowSelectionState
}

type UseGoToEntityReturn = {
  getGoToEntityData: (
    entityId: string,
    entityType: EntityType,
    parents: EntityParents,
  ) => GoToEntityData
  getExpandedFolders: (folderId: string, includeTarget?: boolean) => ExpandedState
  getSelectedFolders: (folderId: string) => RowSelectionState
}

/**
 * Page-agnostic hook for navigating to entities
 *
 * This hook provides utilities to calculate folder expansion and selection states
 * when navigating to an entity. The actual selection logic is left to the consuming page.
 *
 */
const useGoToEntity = (): UseGoToEntityReturn => {
  const { getParentFolderIds } = useProjectFoldersContext()

  const getExpandedFolders = useCallback(
    (folderId: string, includeTarget: boolean = false): ExpandedState => {
      const parentFolderIds = getParentFolderIds(folderId)
      const expandingFolderIds = includeTarget ? [...parentFolderIds, folderId] : parentFolderIds

      return expandingFolderIds.reduce<Record<string, boolean>>((acc, id) => {
        acc[id] = true
        return acc
      }, {}) as ExpandedState
    },
    [getParentFolderIds],
  )

  const getSelectedFolders = useCallback((folderId: string): RowSelectionState => {
    return { [folderId]: true }
  }, [])

  /**
   * Get all data needed to navigate to an entity
   * Pages can use this data to implement their own selection logic
   */
  const getGoToEntityData = useCallback(
    (entityId: string, entityType: EntityType, parents: EntityParents): GoToEntityData => {
      // Determine which folder to expand based on entity type
      let targetFolderId: string | undefined
      let expandedFolders: ExpandedState = {}
      let selectedFolders: RowSelectionState = {}

      if (parents.folder) {
        // For folders, expand parents but not the folder itself
        // For tasks, expand all the way to the parent folder
        targetFolderId = entityType === 'folder' ? parents.folder : parents.folder
        const includeTarget = entityType !== 'folder'
        expandedFolders = getExpandedFolders(targetFolderId, includeTarget)
        selectedFolders = getSelectedFolders(targetFolderId)
      }

      return {
        entityId,
        entityType,
        parents,
        expandedFolders,
        selectedFolders,
      }
    },
    [getExpandedFolders, getSelectedFolders],
  )

  return useMemo(
    () => ({
      getGoToEntityData,
      getExpandedFolders,
      getSelectedFolders,
    }),
    [getGoToEntityData, getExpandedFolders, getSelectedFolders],
  )
}

export default useGoToEntity
