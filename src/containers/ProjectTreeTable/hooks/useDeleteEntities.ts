import { useCallback } from 'react'
import { useUpdateOverviewEntitiesMutation } from '@queries/overview/updateOverview'
import { OperationModel } from '@api/rest/operations'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { parseCellId } from '../utils/cellUtils'
import confirmDelete from '@helpers/confirmDelete'

type UseDeleteEntitiesProps = {
  onSuccess?: () => void
}

const useDeleteEntities = ({ onSuccess }: UseDeleteEntitiesProps) => {
  const { getEntityById, projectName } = useProjectTableContext()
  const [runOperations] = useUpdateOverviewEntitiesMutation()

  const handleDeleteEntities = useCallback(
    async (entityIds: string[]) => {
      if (!entityIds || entityIds.length === 0) {
        return
      }

      const fullEntities = entityIds
        .map((id) => getEntityById(parseCellId(id)?.rowId || ''))
        .filter(Boolean)

      if (fullEntities.length === 0) return

      const deleteEntities = async (force = false) => {
        const operations: OperationModel[] = []
        for (const e of fullEntities) {
          if (!e) continue
          operations.push({
            entityType: 'folderId' in e ? 'task' : 'folder',
            type: 'delete',
            entityId: e.id,
            force,
          })
        }
        try {
          await runOperations({ operationsRequestModel: { operations }, projectName }).unwrap()
          if (onSuccess) {
            onSuccess()
          }
        } catch (error: any) {
          const message = error?.error || 'Failed to delete entities'
          console.error(`Failed to delete entities:`, error)
          throw { message, ...error }
        }
      }

      confirmDelete({
        label: 'folders and tasks',
        message: `Are you sure you want to delete ${entityIds.length} entities?`,
        accept: deleteEntities,
        onError: (error: any) => {
          const FOLDER_WITH_CHILDREN_CODE = 'delete-folder-with-children'
          // check if the error is because of child tasks, products
          if (error?.errorCodes?.includes(FOLDER_WITH_CHILDREN_CODE)) {
            // try again but with force
            confirmDelete({
              label: 'folders and tasks',
              message: `This folder has child tasks or products that will also be deleted. Are you sure you want to delete ${entityIds.length} entities and all of it's dependencies?`,
              accept: () => deleteEntities(true),
              deleteLabel: 'Delete all (dangerous)',
            })
          }
        },
        deleteLabel: 'Delete',
      })
    },
    [projectName, getEntityById, runOperations, onSuccess],
  )

  return handleDeleteEntities
}

export default useDeleteEntities
