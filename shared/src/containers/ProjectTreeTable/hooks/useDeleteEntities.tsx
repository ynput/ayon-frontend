import { useCallback } from 'react'
import { OperationWithRowId, useProjectTableContext, useProjectTableQueriesContext } from '@shared/containers'
// TODO: confirmDelete uses prime react, so we should find a different solution
import { confirmDelete } from '@shared/util'
import { useProjectContext } from '@shared/context'
import { toast } from 'react-toastify'
import {
  FolderDeleteInfo,
  useLazyGetFolderDeleteInfoQuery,
} from '@shared/api/queries/folders/getFolderDeleteInfo'
import { EntityMap } from '../types'
import { DeleteConfirmContent, pluralize } from '../components/DeleteConfirmContent'

type UseDeleteEntitiesProps = {
  onSuccess?: () => void
}

const buildChildrenDetails = (
  topLevelFolders: (EntityMap & { rowId: string })[],
  folderInfo: FolderDeleteInfo[],
): string[] => {
  if (topLevelFolders.length === 0) return []
  const folderInfoMap = new Map(folderInfo.map((f) => [f.id, f]))
  const many = topLevelFolders.length > 1
  const details: string[] = []

  for (const folder of topLevelFolders) {
    const info = folderInfoMap.get(folder.id)
    const prefix = many ? `"${folder.label || folder.name}" contains ` : 'Contains '
    const hasDescendants =
      info &&
      (info.totalFolderCount > 0 ||
        info.totalTaskCount > 0 ||
        info.totalProductCount > 0 ||
        info.totalVersionCount > 0)

    if (hasDescendants) {
      const parts: string[] = []
      if (info.totalFolderCount > 0) parts.push(pluralize(info.totalFolderCount, 'child folder'))
      if (info.totalTaskCount > 0) parts.push(pluralize(info.totalTaskCount, 'task'))
      if (info.totalProductCount > 0) parts.push(pluralize(info.totalProductCount, 'product'))
      if (info.totalVersionCount > 0) parts.push(pluralize(info.totalVersionCount, 'version'))
      details.push(`${prefix}${parts.join(', ')}`)
    } else {
      if ('hasChildren' in folder && folder.hasChildren) {
        details.push(`${prefix}child folders`)
      }
      if ('taskNames' in folder && folder.taskNames && folder.taskNames.length > 0) {
        details.push(`${prefix}${pluralize(folder.taskNames.length, 'task')}`)
      }
    }
  }

  return details
}

const useDeleteEntities = ({ onSuccess }: UseDeleteEntitiesProps) => {
  const { updateEntities } = useProjectTableQueriesContext()
  const { projectName } = useProjectContext()
  const { getEntityById } = useProjectTableContext()
  const [fetchFolderDeleteInfo] = useLazyGetFolderDeleteInfoQuery()

  return useCallback(
    async (entityIds: string[]) => {
      if (!entityIds || entityIds.length === 0) {
        toast.error('No entities selected')
        return
      }

      const fullEntities: (EntityMap & { rowId: string })[] = []
      const addedEntityIds = new Set<string>()
      for (const id of entityIds) {
        const entity = getEntityById(id) as (EntityMap & { rowId: string }) | undefined
        if (entity && !addedEntityIds.has(entity.id)) {
          fullEntities.push(entity)
          addedEntityIds.add(entity.id)
        }
      }

      if (fullEntities.length === 0) {
        toast.error('No entities found')
        return
      }

      const selectedIdSet = new Set(fullEntities.map((e) => e.id))
      const topLevelEntities = fullEntities.filter((e) => {
        if (e.entityType === 'folder' && 'parentId' in e && e.parentId) {
          return !selectedIdSet.has(e.parentId)
        }
        if ('folderId' in e && e.folderId) {
          return !selectedIdSet.has(e.folderId)
        }
        return true
      })

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

      const counts: Record<string, number> = {}
      for (const e of topLevelEntities) {
        counts[e.entityType] = (counts[e.entityType] || 0) + 1
      }

      let entityLabel: string
      if (topLevelEntities.length === 1) {
        const entity = topLevelEntities[0]
        entityLabel = `"${entity.label || entity.name}"`
      } else {
        const typeLabels = ['folder', 'task', 'product', 'version'] as const
        const parts = typeLabels
          .filter((type) => counts[type] > 0)
          .map((type) => pluralize(counts[type], type))
        entityLabel = parts.join(', ')
      }

      const topLevelFolders = topLevelEntities.filter((e) => e.entityType === 'folder')

      let childrenDetails: string[] = []
      if (topLevelFolders.length > 0 && projectName) {
        try {
          const folderInfo = await fetchFolderDeleteInfo({
            projectName,
            folderIds: topLevelFolders.map((f) => f.id),
          }).unwrap()
          childrenDetails = buildChildrenDetails(topLevelFolders, folderInfo)
        } catch (error) {
          console.warn('Failed to fetch folder delete info, falling back to local data', error)
          childrenDetails = buildChildrenDetails(topLevelFolders, [])
        }
      }

      confirmDelete({
        label: 'folders and tasks',
        message: (
          <DeleteConfirmContent entityLabel={entityLabel} childrenDetails={childrenDetails} />
        ),
        accept: deleteEntities,
        onError: (error: any) => {
          const FOLDER_WITH_CHILDREN_CODE = 'delete-folder-with-children'
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
    [getEntityById, updateEntities, onSuccess, projectName, fetchFolderDeleteInfo],
  )
}

export default useDeleteEntities
