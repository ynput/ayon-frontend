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

        setIsEntityPickerOpen(false)

        try {
            // Prepare move operation
            const moveOperation: OperationModel = {
                id: `move-${moveDialog.entityId}-${Date.now()}`,
                type: 'update',
                entityType: moveDialog.entityType,
                entityId: moveDialog.entityId,
                data: moveDialog.entityType === 'folder'
                    ? { parentId: targetFolderId }
                    : { folderId: targetFolderId }
            }

            // Use the mutation with built-in optimistic updates and rollback
            const result = await updateOverviewEntities({
                projectName,
                operationsRequestModel: {
                    operations: [moveOperation],
                },
            }).unwrap()


            const operationResult = result?.operations?.find(
                (op: OperationResponseModel) => op.id === moveOperation.id
            )

            if (operationResult?.success === false) {
                throw new Error(operationResult.detail || 'Move operation failed')
            }

        } catch (error: any) {
            console.error('Failed to move entity:', error)

            // Extract and improve error message
            let errorMessage = error?.data?.detail ||
                             error?.error ||
                             error?.message ||
                             'Failed to move entity'

            // Improve specific error messages for better UX
            if (errorMessage.includes('already exists')) {
                if (moveDialog.entityType === 'task') {
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
