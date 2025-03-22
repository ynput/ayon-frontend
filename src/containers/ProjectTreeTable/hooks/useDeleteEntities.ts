import { useCallback } from 'react'
import { useUpdateOverviewEntitiesMutation } from '@queries/overview/updateOverview'
import { OperationModel } from '@api/rest/operations'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { toast } from 'react-toastify'
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

      const operations: OperationModel[] = []
      for (const e of fullEntities) {
        if (!e) continue
        operations.push({
          entityType: 'folderId' in e ? 'task' : 'folder',
          type: 'delete',
          entityId: e.id,
        })
      }

      if (operations.length === 0) return

      const deleteEntities = async () => {
        try {
          await runOperations({ operationsRequestModel: { operations }, projectName }).unwrap()
          if (onSuccess) {
            onSuccess()
          }
        } catch (error) {
          console.error(`Failed to delete entities:`, error)
          toast.error('Failed to delete entities')
        }
      }

      confirmDelete({
        label: 'folders and tasks',
        message: `Are you sure you want to delete ${entityIds.length} entities?`,
        accept: deleteEntities,
        onError: () => {},
        onSuccess: () => {},
        deleteLabel: 'Delete',
      })
    },
    [projectName, getEntityById, runOperations, onSuccess],
  )

  return handleDeleteEntities
}

export default useDeleteEntities
