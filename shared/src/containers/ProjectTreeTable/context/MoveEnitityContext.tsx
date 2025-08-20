import React, { createContext, useState, ReactNode, useContext } from 'react'
import { toast } from 'react-toastify'
import {
    useUpdateOverviewEntitiesMutation,
    OperationModel,
    OperationResponseModel,
} from '@shared/api'
import {createLocalStorageKey, useExpandedState, useProjectDataContext} from "@shared/containers";

type NewEntityType = 'folder' | 'task'

interface EntityMoveData {
    entityId: string
    entityType: NewEntityType
}

interface MultiEntityMoveData {
    entities: EntityMoveData[]
}

interface MoveEntityContextProps {
    // State
    moveDialog: MultiEntityMoveData | null
    isEntityPickerOpen: boolean

    // Actions
    openMoveDialog: (entityData: EntityMoveData | MultiEntityMoveData) => void
    closeMoveDialog: () => void
    handleMoveSubmit: (selectedFolderIds: string[]) => Promise<void>
    handleMoveToRoot: () => Promise<void>
}
export const MoveEntityContext = createContext<MoveEntityContextProps | undefined>(undefined)

interface MoveEntityProviderProps {
    children: ReactNode
}
export const MoveEntityProvider: React.FC<MoveEntityProviderProps> = ({ children }) => {
    const { projectName } = useProjectDataContext()
    const [updateOverviewEntities] = useUpdateOverviewEntitiesMutation()

    // Dialog state
    const [moveDialog, setMoveDialog] = useState<MultiEntityMoveData | null>(null)
    const [isEntityPickerOpen, setIsEntityPickerOpen] = useState(false)

    const openMoveDialog = (entityData: EntityMoveData | MultiEntityMoveData) => {
        console.log('openMoveDialog', entityData)
        // Convert single entity to multi-entity format
        const multiEntityData: MultiEntityMoveData = 'entities' in entityData 
            ? entityData 
            : { entities: [entityData] }
        setMoveDialog(multiEntityData)
        setIsEntityPickerOpen(true)
    }

    const closeMoveDialog = () => {
        setMoveDialog(null)
        setIsEntityPickerOpen(false)
    }

    const handleMoveSubmit = async (selectedFolderIds: string[]) => {
        if (!moveDialog || selectedFolderIds.length === 0) return

        const targetFolderId = selectedFolderIds[0]

        setIsEntityPickerOpen(false)

        try {
            // Prepare move operations for all entities
            const moveOperations: OperationModel[] = moveDialog.entities.map((entity, index) => ({
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
            if (moveDialog.entities.length > 1) {
                toast.success(`Successfully moved ${moveDialog.entities.length} entities`)
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
                if (moveDialog.entities.length > 1) {
                    errorMessage = `Cannot move some entities - one or more entities with the same name already exist in the target location`
                } else {
                    const entity = moveDialog.entities[0]
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
            setMoveDialog(null)
            setIsEntityPickerOpen(false)
        }
    }

    const handleMoveToRoot = async () => {
        if (!moveDialog) return

        setIsEntityPickerOpen(false)

        try {
            // Prepare move operations for all entities to move to root (null parentId/folderId)
            const moveOperations: OperationModel[] = moveDialog.entities.map((entity, index) => ({
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
            if (moveDialog.entities.length > 1) {
                toast.success(`Successfully moved ${moveDialog.entities.length} entities to root`)
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
            setMoveDialog(null)
            setIsEntityPickerOpen(false)
        }
    }

    const value: MoveEntityContextProps = {
        moveDialog,
        isEntityPickerOpen,
        openMoveDialog,
        closeMoveDialog,
        handleMoveSubmit,
        handleMoveToRoot,
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
