import { toast } from 'react-toastify'

interface UseMenuActionsProps {
  entityType: string
  firstEntityData: any
  firstProject: string
  onOpenPip: () => void
  onOpenVersionUpload: any
  entityListsContext: any
  triggerFileUpload: () => void
  setShowDetailsDialog: (show: boolean) => void
  setSelectedValue: (value: string[]) => void
}

export const useMenuActions = ({
  entityType,
  firstEntityData,
  firstProject,
  onOpenPip,
  onOpenVersionUpload,
  entityListsContext,
  triggerFileUpload,
  setShowDetailsDialog,
  setSelectedValue,
}: UseMenuActionsProps) => {
  const actionHandlers = {
    'picture-in-picture': () => {
      onOpenPip()
    },
    'upload-thumbnail': () => {
      triggerFileUpload()
    },
    'upload-version': () => {
      if (onOpenVersionUpload && firstEntityData && firstProject) {
        const productId = firstEntityData.product?.id
        const taskId = firstEntityData.task?.id
        const folderId = firstEntityData.folder?.id

        onOpenVersionUpload({
          productId,
          taskId,
          folderId,
        })
      } else {
        toast.info('Version upload is only available in project pages')
      }
    },
    'view-details': () => {
      setShowDetailsDialog(true)
    },
    'add-to-list': () => {
      if (entityListsContext && firstEntityData && firstProject) {
        const selectedEntities = [
          {
            entityId: firstEntityData.id,
            entityType: entityType,
          },
        ]

        entityListsContext.openCreateNewList(entityType as any, selectedEntities)
      } else {
        console.log('Add to list not available in this context')
      }
    },
  }

  const handleMoreMenuAction = (value: string) => {
    const handler = actionHandlers[value as keyof typeof actionHandlers]
    
    if (handler) {
      handler()
    } else {
      console.log('Unknown action:', value)
    }

    setSelectedValue([])
  }

  return {
    handleMoreMenuAction,
  }
}
