import React, { createContext, useState, ReactNode, useContext } from 'react'
import { toast } from 'react-toastify'
import {
    useUpdateOverviewEntitiesMutation,
    OperationModel,
    OperationResponseModel,
} from '@shared/api'
import {useProjectDataContext} from "@shared/containers";
import {getEntityId} from "@shared/util";


type NewEntityType = 'folder' | 'task'

interface EntityMoveData {
    entityId: string
    entityType: NewEntityType
}

interface MoveEntityContextProps {
    // State
    moveDialog: EntityMoveData | null
    isEntityPickerOpen: boolean

    // Actions
    openMoveDialog: (entityData: EntityMoveData) => void
    closeMoveDialog: () => void
    handleMoveSubmit: (selectedFolderIds: string[]) => Promise<void>
}
export const MoveEntityContext = createContext<MoveEntityContextProps | undefined>(undefined)

interface MoveEntityProviderProps {
    children: ReactNode
}
export const MoveEntityProvider: React.FC<MoveEntityProviderProps> = ({ children }) => {
    const { projectName } = useProjectDataContext()
    const [updateOverviewEntities] = useUpdateOverviewEntitiesMutation()

    // Dialog state
    const [moveDialog, setMoveDialog] = useState<EntityMoveData | null>(null)
    const [isEntityPickerOpen, setIsEntityPickerOpen] = useState(false)

    const openMoveDialog = (entityData: EntityMoveData) => {
        console.log('openMoveDialog', entityData)
        setMoveDialog(entityData)
        setIsEntityPickerOpen(true)
    }

    const closeMoveDialog = () => {
        setMoveDialog(null)
        setIsEntityPickerOpen(false)
    }

    const handleMoveSubmit = async (selectedFolderIds: string[]) => {
        if (!moveDialog || selectedFolderIds.length === 0) return

        const targetFolderId = selectedFolderIds[0]
        const entity = getEntityId()

        if (!entity) {
            toast.error('Entity not found')
            return
        }


        setIsEntityPickerOpen(false)


        const originalParentId = moveDialog.entityType === 'folder'
            ? (entity as any).parentId
            : (entity as any).folderId

        try {
            // Prepare optimistic update operation
            const optimisticUpdate: OperationModel = {
                id: `optimistic-move-${moveDialog.entityId}`,
                type: 'update',
                entityType: moveDialog.entityType,
                entityId: moveDialog.entityId,
                data: moveDialog.entityType === 'folder'
                    ? { parentId: targetFolderId }
                    : { folderId: targetFolderId }
            }

            // Perform optimistic update and API call
            const result = await updateOverviewEntities({
                projectName,
                operationsRequestModel: {
                    operations: [optimisticUpdate],
                },
            }).unwrap()

            // Check if the operation was successful
            const operationResult = result?.operations?.find(
                (op: OperationResponseModel) => op.id === optimisticUpdate.id
            )

            if (operationResult?.success === false) {
                throw new Error('Move operation failed')
            }


        } catch (error) {
            console.error('Failed to move entity:', error)

            // Rollback optimistic update on error
            try {
                const rollbackUpdate: OperationModel = {
                    id: `rollback-move-${moveDialog.entityId}`,
                    type: 'update',
                    entityType: moveDialog.entityType,
                    entityId: moveDialog.entityId,
                    data: moveDialog.entityType === 'folder'
                        ? { parentId: originalParentId }
                        : { folderId: originalParentId }
                }

                await updateOverviewEntities({
                    projectName,
                    operationsRequestModel: {
                        operations: [rollbackUpdate],
                    },
                })
            } catch (rollbackError) {
                console.warn('Failed to rollback optimistic update:', rollbackError)
            }

            toast.error('Failed to move entity')
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
