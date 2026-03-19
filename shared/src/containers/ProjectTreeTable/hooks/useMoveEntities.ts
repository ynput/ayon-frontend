import { useCallback, useMemo } from 'react'
import { toast } from 'react-toastify'
import {
  OperationModel,
  OperationResponseModel,
  useUpdateOverviewEntitiesMutation,
} from '@shared/api'
import { useProjectTableContext } from '@shared/containers'
import {
  useMoveEntityContext,
  EntityMoveData,
  MultiEntityMoveData,
} from '@shared/context/MoveEntityContext'
import { useProjectFoldersContext } from '@shared/context'

export type EntityType = 'folder' | 'task'

interface UseMoveEntitiesProps {
  projectName: string
}

export const useMoveEntities = ({ projectName }: UseMoveEntitiesProps) => {
  const {
    movingEntities,
    isEntityPickerOpen,
    openMoveDialog,
    closeMoveDialog,
    setEntityPickerOpen,
    clearMovingEntities,
  } = useMoveEntityContext()
  const [updateOverviewEntities] = useUpdateOverviewEntitiesMutation()

  // Get project context for entity data
  const { tableData, getEntityById } = useProjectTableContext()

  // Get folder data to check hasVersions property
  const { folders } = useProjectFoldersContext()

  // Action dispatchers
  const openMoveDialogHandler = useCallback(
    (entityData: EntityMoveData | MultiEntityMoveData) => {
      openMoveDialog(entityData)
    },
    [openMoveDialog],
  )

  const closeMoveDialogHandler = useCallback(() => {
    closeMoveDialog()
  }, [closeMoveDialog])

  // Move submit handler
  const handleMoveSubmit = useCallback(
    async (selectedFolderIds: string[]) => {
      if (!movingEntities || selectedFolderIds.length === 0) return

      const targetFolderId = selectedFolderIds[0]
      setEntityPickerOpen(false)

      try {
        // Prepare move operations for all entities
        const moveOperations: OperationModel[] = movingEntities.entities.map(
          (entity: EntityMoveData, index: number) => ({
            id: `move-${entity.entityId}-${Date.now()}-${index}`,
            type: 'update',
            entityType: entity.entityType,
            entityId: entity.entityId,
            data:
              entity.entityType === 'folder'
                ? { parentId: targetFolderId }
                : { folderId: targetFolderId },
          }),
        )

        // Use the mutation with built-in optimistic updates and rollback
        const result = await updateOverviewEntities({
          projectName,
          operationsRequestModel: {
            operations: moveOperations,
          },
        }).unwrap()

        // Check for any failed operations
        const failedOperations =
          result?.operations?.filter((op: OperationResponseModel) => op.success === false) || []

        if (failedOperations.length > 0) {
          const errorDetails = failedOperations.map((op) => op.detail).join(', ')
          throw new Error(errorDetails || 'Some move operations failed')
        }
      } catch (error: any) {
        console.error('Failed to move entity:', error)

        // Extract and improve error message
        let errorMessage =
          error?.data?.detail || error?.error || error?.message || 'Failed to move entities'

        // Improve specific error messages for better UX
        if (errorMessage.includes('already exists')) {
          // For multiple entities, provide a more general message
          if (movingEntities.entities.length > 1) {
            errorMessage = `Cannot move some entities - one or more entities with the same name already exist in the target location`
          } else {
            const entity = movingEntities.entities[0]
            if (entity.entityType === 'task') {
              // Extract task name from error message if possible
              const nameMatch = errorMessage.match(/name '.*?, (.+?)' already exists/)
              const taskName = nameMatch ? nameMatch[1] : 'this task'
              errorMessage = `Cannot move "${taskName}" - a task with this name already exists in the target folder`
            } else {
              // Extract folder name from error message if possible
              const nameMatch = errorMessage.match(/name '.*?, (.+?)' already exists/)
              const folderName = nameMatch ? nameMatch[1] : 'this folder'
              errorMessage = `Cannot move "${folderName}" - a folder with this name already exists in the target location`
            }
          }
        }

        toast.error(errorMessage)
      } finally {
        clearMovingEntities()
        setEntityPickerOpen(false)
      }
    },
    [
      movingEntities,
      projectName,
      updateOverviewEntities,
      openMoveDialog,
      closeMoveDialog,
      setEntityPickerOpen,
      clearMovingEntities,
    ],
  )

  // Move to root handler
  const handleMoveToRoot = useCallback(async () => {
    if (!movingEntities) return

    setEntityPickerOpen(false)

    try {
      // Prepare move operations for all entities to move to root (null parentId/folderId)
      const moveOperations: OperationModel[] = movingEntities.entities.map(
        (entity: EntityMoveData, index: number) => ({
          id: `move-to-root-${entity.entityId}-${Date.now()}-${index}`,
          type: 'update',
          entityType: entity.entityType,
          entityId: entity.entityId,
          data: entity.entityType === 'folder' ? { parentId: null } : { folderId: null },
        }),
      )

      // Use the mutation with built-in optimistic updates and rollback
      const result = await updateOverviewEntities({
        projectName,
        operationsRequestModel: {
          operations: moveOperations,
        },
      }).unwrap()

      // Check for any failed operations
      const failedOperations =
        result?.operations?.filter((op: OperationResponseModel) => op.success === false) || []

      if (failedOperations.length > 0) {
        const errorDetails = failedOperations.map((op) => op.detail).join(', ')
        throw new Error(errorDetails || 'Some move operations failed')
      }
    } catch (error: any) {
      console.error('Failed to move entities to root:', error)

      // Extract and improve error message
      let errorMessage =
        error?.data?.detail || error?.error || error?.message || 'Failed to move entities to root'

      toast.error(errorMessage)
    } finally {
      clearMovingEntities()
      setEntityPickerOpen(false)
    }
  }, [
    movingEntities,
    projectName,
    updateOverviewEntities,
    openMoveDialog,
    closeMoveDialog,
    setEntityPickerOpen,
    clearMovingEntities,
  ])

  // Get disabled folder IDs
  const getDisabledFolderIds = useCallback((): string[] => {
    if (!movingEntities) return []
    const disabledIds: string[] = []

    // Add the entities being moved themselves to prevent moving to themselves
    movingEntities.entities.forEach((entity: EntityMoveData) => {
      disabledIds.push(entity.entityId)
    })

    // Add folders where name conflicts would occur
    folders.forEach((targetFolder) => {
      // Check if any moving entity has the same name as existing children in this folder
      const hasNameConflict = movingEntities.entities.some((movingEntity: EntityMoveData) => {
        // Get the name of the entity being moved
        const movingEntityData = getEntityById(movingEntity.entityId)
        if (!movingEntityData?.name) return false

        // Find all entities that would be siblings in the target folder
        const existingSiblings = tableData.filter((entity) => {
          // For folders, check parentId
          if (movingEntity.entityType === 'folder') {
            return entity.entityType === 'folder' && entity.parentId === targetFolder.id
          }
          // For tasks, check folderId
          if (movingEntity.entityType === 'task') {
            return entity.entityType === 'task' && entity.folderId === targetFolder.id
          }
          return false
        })

        // Check if any sibling has the same name (excluding the entity being moved itself)
        return existingSiblings.some(
          (sibling) =>
            sibling.name === movingEntityData.name && sibling.entityId !== movingEntity.entityId,
        )
      })

      if (hasNameConflict) {
        disabledIds.push(targetFolder.id)
      }
    })

    return [...new Set(disabledIds)]
  }, [movingEntities, folders, tableData, getEntityById])

  // Get disabled message for a folder
  const getDisabledMessage = useCallback(
    (folderId: string): string | undefined => {
      if (!movingEntities) return undefined

      // 1. Check if this folder is the entity being moved itself.
      const isEntityItself = movingEntities.entities.some(
        (entity: EntityMoveData) => entity.entityType === 'folder' && entity.entityId === folderId,
      )

      if (isEntityItself) {
        return 'Cannot move folder to itself'
      }

      // 2. Check if this is the current parent folder.
      const isCurrentParent = movingEntities.entities.some(
        (entity: EntityMoveData) => entity.currentParentId === folderId,
      )

      if (isCurrentParent) {
        return 'Cannot move to the same location'
      }

      // 4. Check for name conflicts - entity with same name already exists in target folder
      const targetFolder = folders.find((folder) => folder.id === folderId)
      if (targetFolder) {
        const conflictingEntity = movingEntities.entities.find((movingEntity: EntityMoveData) => {
          // Get the name of the entity being moved
          const movingEntityData = getEntityById(movingEntity.entityId)
          if (!movingEntityData?.name) return false

          // Find all entities that would be siblings in the target folder
          const existingSiblings = tableData.filter((entity) => {
            // For folders, check parentId
            if (movingEntity.entityType === 'folder') {
              return entity.entityType === 'folder' && entity.parentId === targetFolder.id
            }
            // For tasks, check folderId
            if (movingEntity.entityType === 'task') {
              return entity.entityType === 'task' && entity.folderId === targetFolder.id
            }
            return false
          })

          // Check if any sibling has the same name (excluding the entity being moved itself)
          return existingSiblings.some(
            (sibling) =>
              sibling.name === movingEntityData.name && sibling.entityId !== movingEntity.entityId,
          )
        })

        if (conflictingEntity) {
          const entityData = getEntityById(conflictingEntity.entityId)
          const entityName = entityData?.name || 'Entity'
          return `Cannot move "${entityName}" - an entity with the same name already exists in this folder`
        }
      }

      // 5. Check if the target is a child folder (simplified check)
      const isChildFolder = movingEntities.entities.some(
        (entity: EntityMoveData) => entity.entityType === 'folder',
      )

      if (isChildFolder) {
        return 'Cannot move folder to its child'
      }

      // Default message
      return 'Cannot move to this location'
    },
    [movingEntities, folders, tableData, getEntityById],
  )

  // Check if we can show "Move to root" option
  const canMoveToRoot = useMemo(() => {
    return (
      movingEntities?.entities.every((entity: EntityMoveData) => entity.entityType === 'folder') ||
      false
    )
  }, [movingEntities])

  return {
    // State
    movingEntities,
    isEntityPickerOpen,

    // Actions (keeping legacy names for compatibility)
    isDialogOpen: isEntityPickerOpen,
    openMoveDialog: openMoveDialogHandler,
    closeMoveDialog: closeMoveDialogHandler,
    handleMoveSubmit,
    handleMoveToRoot,
    getDisabledFolderIds,
    getDisabledMessage,
    canMoveToRoot,
  }
}
