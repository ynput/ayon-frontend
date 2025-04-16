import { useCallback } from 'react'
import { useProjectTableQueriesContext } from '../context/ProjectTableQueriesContext'
import { parseCellId } from '../utils/cellUtils'
// TODO: confirmDelete uses prime react, so we should find a different solution
import { confirmDelete } from '../../helpers'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { OperationModel } from '../types/operations'

type UseDeleteEntitiesProps = {
  onSuccess?: () => void
}

const useDeleteEntities = ({ onSuccess }: UseDeleteEntitiesProps) => {
  const { updateEntities } = useProjectTableQueriesContext()

  const { getEntityById } = useProjectTableContext()

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
          await updateEntities?.({ operations })
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
    [getEntityById, updateEntities, onSuccess],
  )

  return handleDeleteEntities
}

export default useDeleteEntities
