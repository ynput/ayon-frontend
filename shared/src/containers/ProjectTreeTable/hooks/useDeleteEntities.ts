import { useCallback } from 'react'
import { useProjectTableQueriesContext } from '../context/ProjectTableQueriesContext'
// TODO: confirmDelete uses prime react, so we should find a different solution
import { confirmDelete } from '../../../util'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { toast } from 'react-toastify'
import { EntityMap } from '../types'
import { OperationWithRowId } from './useUpdateTableData'

type UseDeleteEntitiesProps = {
  onSuccess?: () => void
}

const useDeleteEntities = ({ onSuccess }: UseDeleteEntitiesProps) => {
  const { updateEntities } = useProjectTableQueriesContext()

  const { getEntityById } = useProjectTableContext()

  const getValidEntity = (entityId: string): (EntityMap & { rowId: string }) | null => {
    const entity = getEntityById(entityId) as EntityMap & { rowId: string }
    return entity || null
  }

  const handleDeleteEntities = useCallback(
    async (entityIds: string[]) => {
      if (!entityIds || entityIds.length === 0) {
        toast.error('No entities selected')
        return
      }

      const fullEntities: (EntityMap & { rowId: string })[] = []
      const addedEntityIds = new Set<string>()

      for (const id of entityIds) {
        const entity = getValidEntity(id)
        if (entity && !addedEntityIds.has(entity.id)) {
          fullEntities.push(entity)
          addedEntityIds.add(entity.id)
        }
      }

      if (fullEntities.length === 0) {
        toast.error('No entities found')
        return
      }

      const deleteEntities = async (force = false) => {
        const operations: OperationWithRowId[] = []
        for (const e of fullEntities) {
          if (!e) continue
          operations.push({
            entityType: 'folderId' in e ? 'task' : 'folder',
            type: 'delete',
            entityId: e.id,
            rowId: e.rowId,
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

      const entityLabel =
        fullEntities.length === 1
          ? `"${fullEntities[0].label || fullEntities[0].name}"`
          : `${fullEntities.length} entities`

      confirmDelete({
        label: 'folders and tasks',
        message: `Are you sure you want to delete ${entityLabel}? This action cannot be undone.`,
        accept: deleteEntities,
        onError: (error: any) => {
          const FOLDER_WITH_CHILDREN_CODE = 'delete-folder-with-children'
          // check if the error is because of child tasks, products
          if (error?.errorCodes?.includes(FOLDER_WITH_CHILDREN_CODE)) {
            // try again but with force
            confirmDelete({
              label: 'folders and tasks',
              message: `This folder has child tasks or products that will also be deleted. Are you sure you want to delete ${entityLabel} and all of it's dependencies?`,
              accept: () => deleteEntities(true),
              deleteLabel: 'Delete all (dangerous)',
            })
          }
        },
        deleteLabel: 'Delete forever',
      })
    },
    [getEntityById, updateEntities, onSuccess],
  )

  return handleDeleteEntities
}

export default useDeleteEntities
