import React, {createContext, ReactNode, useContext, useState} from 'react'
import {toast} from 'react-toastify'
import {OperationModel, OperationResponseModel, useUpdateOverviewEntitiesMutation,} from '@shared/api'
import {useProjectDataContext} from "@shared/containers";

type NewEntityType = 'folder' | 'task'

interface EntityMoveData {
    entityId: string
    entityType: NewEntityType
    name?: string
    currentParentId?: string
}

interface MultiEntityMoveData {
    entities: EntityMoveData[]
}

interface MoveEntityContextProps {
    // State
    movingEntities: MultiEntityMoveData | null
    isEntityPickerOpen: boolean

    // Actions
    openMoveDialog: (entityData: EntityMoveData | MultiEntityMoveData) => void
    closeMoveDialog: () => void
    handleMoveSubmit: (selectedFolderIds: string[]) => Promise<void>
    handleMoveToRoot: () => Promise<void>
    getDisabledFolderIds: () => string[]
    getDisabledMessage: (folderId: string) => string | undefined
}
export const MoveEntityContext = createContext<MoveEntityContextProps | undefined>(undefined)

interface MoveEntityProviderProps {
    children: ReactNode
}
export const MoveEntityProvider: React.FC<MoveEntityProviderProps> = ({ children }) => {
    const { projectName } = useProjectDataContext()
    const [updateOverviewEntities] = useUpdateOverviewEntitiesMutation()

    // Dialog state
    const [movingEntities, setMovingEntities] = useState<MultiEntityMoveData | null>(null)
    const [isEntityPickerOpen, setIsEntityPickerOpen] = useState(false)

    const openMoveDialog = (entityData: EntityMoveData | MultiEntityMoveData) => {
        // Convert single entity to multi-entity format
        const multiEntityData: MultiEntityMoveData = 'entities' in entityData
            ? entityData
            : { entities: [entityData] }
        setMovingEntities(multiEntityData)
        setIsEntityPickerOpen(true)
    }

    const closeMoveDialog = () => {
        setMovingEntities(null)
        setIsEntityPickerOpen(false)
    }

    const handleMoveSubmit = async (selectedFolderIds: string[]) => {
        if (!movingEntities || selectedFolderIds.length === 0) return

        const targetFolderId = selectedFolderIds[0]

        setIsEntityPickerOpen(false)

        try {
            // Prepare move operations for all entities
            const moveOperations: OperationModel[] = movingEntities.entities.map((entity, index) => ({
                id: `move-${entity.entityId}-${Date.now()}-${index}`,
                type: 'update',
                entityType: entity.entityType,
                entityId: entity.entityId,
                data: entity.entityType === 'folder'
                    ? { parentId: targetFolderId }
                    : { folderId: targetFolderId }
            }))

            // Use the mutation with built-in optimistic updates and rollback
            const result = await updateOverviewEntities({
                projectName,
                operationsRequestModel: {
                    operations: moveOperations,
                },
            }).unwrap()

            // Check for any failed operations
            const failedOperations = result?.operations?.filter(
                (op: OperationResponseModel) => op.success === false
            ) || []

            if (failedOperations.length > 0) {
                const errorDetails = failedOperations.map(op => op.detail).join(', ')
                throw new Error(errorDetails || 'Some move operations failed')
            }

            // Show success message for multiple entities
            if (movingEntities.entities.length > 1) {
                toast.success(`Successfully moved ${movingEntities.entities.length} entities`)
            }

        } catch (error: any) {
            console.error('Failed to move entity:', error)

            // Extract and improve error message
            let errorMessage = error?.data?.detail ||
                             error?.error ||
                             error?.message ||
                             'Failed to move entities'

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
            setMovingEntities(null)
            setIsEntityPickerOpen(false)
        }
    }

    const handleMoveToRoot = async () => {
        if (!movingEntities) return

        setIsEntityPickerOpen(false)

        try {
            // Prepare move operations for all entities to move to root (null parentId/folderId)
            const moveOperations: OperationModel[] = movingEntities.entities.map((entity, index) => ({
                id: `move-to-root-${entity.entityId}-${Date.now()}-${index}`,
                type: 'update',
                entityType: entity.entityType,
                entityId: entity.entityId,
                data: entity.entityType === 'folder'
                    ? { parentId: null }
                    : { folderId: null }
            }))

            // Use the mutation with built-in optimistic updates and rollback
            const result = await updateOverviewEntities({
                projectName,
                operationsRequestModel: {
                    operations: moveOperations,
                },
            }).unwrap()

            // Check for any failed operations
            const failedOperations = result?.operations?.filter(
                (op: OperationResponseModel) => op.success === false
            ) || []

            if (failedOperations.length > 0) {
                const errorDetails = failedOperations.map(op => op.detail).join(', ')
                throw new Error(errorDetails || 'Some move operations failed')
            }

            // Show success message
            if (movingEntities.entities.length > 1) {
                toast.success(`Successfully moved ${movingEntities.entities.length} entities to root`)
            } else {
                toast.success(`Successfully moved to root`)
            }

        } catch (error: any) {
            console.error('Failed to move entities to root:', error)

            // Extract and improve error message
            let errorMessage = error?.data?.detail ||
                             error?.error ||
                             error?.message ||
                             'Failed to move entities to root'

            toast.error(errorMessage)
        } finally {
            setMovingEntities(null)
            setIsEntityPickerOpen(false)
        }
    }


    const getDisabledFolderIds = (): string[] => {
        if (!movingEntities) return []
        const disabledIds: string[] = []

        movingEntities.entities.forEach(entity => {
            disabledIds.push(entity.entityId)

        })
        return [...new Set(disabledIds)]
    }

    // Function to get custom disabled message for a folder
    const getDisabledMessage = (folderId: string): string | undefined => {
        if (!movingEntities) return undefined;

        // 1. Check if the target is a child folder. This is the most specific check.
        const isChildFolder = movingEntities.entities.some(
            (entity) =>
                entity.entityType === 'folder'
        );

        if (isChildFolder) {
            return 'Cannot move folder to its child';
        }

        // 2. Check if this folder is the entity being moved itself.
        const isEntityItself = movingEntities.entities.some(
            (entity) => entity.entityType === 'folder' && entity.entityId === folderId
        );

        if (isEntityItself) {
            return 'Cannot move folder to itself';
        }

        // 3. Check if this is the current parent folder.
        const isCurrentParent = movingEntities.entities.some(
            (entity) => entity.currentParentId === folderId
        );

        if (isCurrentParent) {
            return 'Cannot move to the same location';
        }

        // Default message
        return 'Cannot move to this location';
    };



    const value: MoveEntityContextProps = {
        movingEntities,
        isEntityPickerOpen,
        openMoveDialog,
        closeMoveDialog,
        handleMoveSubmit,
        handleMoveToRoot,
        getDisabledFolderIds,
        getDisabledMessage,
    }

    return <MoveEntityContext.Provider value={value}>{children}</MoveEntityContext.Provider>
}

// Custom hook to use the move entity context
export const useMoveEntity = (): MoveEntityContextProps => {
    const context = useContext(MoveEntityContext)
    if (!context) {
        throw new Error('useMoveEntity must be used within a MoveEntityProvider')
    }
    return context
}
