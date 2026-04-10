import { useCallback, createElement } from 'react'
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

      // Count entities by type in a single pass
      const counts: Record<string, number> = {}
      for (const e of fullEntities) {
        counts[e.entityType] = (counts[e.entityType] || 0) + 1
      }

      const pluralize = (count: number, singular: string): string =>
        `${count} ${count === 1 ? singular : singular + 's'}`

      // Build a descriptive label based on entity types and counts
      let entityLabel: string
      if (fullEntities.length === 1) {
        const entity = fullEntities[0]
        entityLabel = `"${entity.label || entity.name}"`
      } else {
        const typeLabels = ['folder', 'task', 'product', 'version'] as const
        const parts = typeLabels
          .filter((type) => counts[type] > 0)
          .map((type) => pluralize(counts[type], type))
        entityLabel = parts.join(', ')
      }

      // Build extra details about children that will also be deleted
      const childrenDetails: string[] = []
      const folders = fullEntities.filter((e) => e.entityType === 'folder')
      for (const folder of folders) {
        if ('hasChildren' in folder && folder.hasChildren) {
          childrenDetails.push(`"${folder.label || folder.name}" contains child folders`)
        }
        if ('taskNames' in folder && folder.taskNames && folder.taskNames.length > 0) {
          childrenDetails.push(
            `"${folder.label || folder.name}" contains ${pluralize(folder.taskNames.length, 'task')}`,
          )
        }
      }

      const message = createElement('div', null,
        createElement('p', null, `Are you sure you want to delete ${entityLabel}? This action cannot be undone.`),
        childrenDetails.length > 0 && createElement('div', { style: { marginTop: 12 } },
          createElement('p', { style: { fontWeight: 600 } }, 'The following will also be affected:'),
          createElement('ul', { style: { margin: '4px 0', paddingLeft: 20, maxHeight: 200, overflowY: 'auto' as const } },
            ...childrenDetails.map((detail, i) =>
              createElement('li', { key: i, style: { marginBottom: 2 } }, detail),
            ),
          ),
        ),
      )

      confirmDelete({
        label: 'folders and tasks',
        message,
        accept: deleteEntities,
        onError: (error: any) => {
          const FOLDER_WITH_CHILDREN_CODE = 'delete-folder-with-children'
          // check if the error is because of child tasks, products
          if (error?.errorCodes?.includes(FOLDER_WITH_CHILDREN_CODE)) {
            const confirmForce = window.confirm(
              `Are you really sure you want to delete ${entityLabel} and all of its dependencies? This cannot be undone. (NOT RECOMMENDED)`,
            )
            if (confirmForce) {
              deleteEntities(true)
            } else {
              console.log('User cancelled forced delete')
            }
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
