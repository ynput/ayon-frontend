import { useCallback, createElement } from 'react'
import { useDispatch } from 'react-redux'
import { useProjectTableQueriesContext } from '../context/ProjectTableQueriesContext'
// TODO: confirmDelete uses prime react, so we should find a different solution
import { confirmDelete } from '../../../util'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { useProjectContext } from '../../../context'
import { toast } from 'react-toastify'
import { EntityMap } from '../types'
import { OperationWithRowId } from './useUpdateTableData'
import { gqlApi } from '../../../api/generated'

type UseDeleteEntitiesProps = {
  onSuccess?: () => void
}

type FolderDeleteInfo = {
  id: string
  name: string
  label?: string | null
  descendantCount: number
  descendantTaskCount: number
}

const useDeleteEntities = ({ onSuccess }: UseDeleteEntitiesProps) => {
  const { updateEntities } = useProjectTableQueriesContext()
  const { projectName } = useProjectContext()
  const dispatch = useDispatch()

  const { getEntityById } = useProjectTableContext()

  const getValidEntity = (entityId: string): (EntityMap & { rowId: string }) | null => {
    const entity = getEntityById(entityId) as EntityMap & { rowId: string }
    return entity || null
  }

  // Fetch recursive descendant counts for folders via GraphQL
  const fetchFolderDeleteInfo = async (folderIds: string[]): Promise<Map<string, FolderDeleteInfo>> => {
    const map = new Map<string, FolderDeleteInfo>()
    if (!folderIds.length || !projectName) return map

    try {
      const result = await dispatch(
        // @ts-expect-error - endpoint generated after yarn generate-gql
        gqlApi.endpoints.GetFolderDeleteInfo.initiate({
          projectName,
          folderIds,
        }),
      )

      const edges = (result as any)?.data?.project?.folders?.edges
      if (edges) {
        for (const edge of edges) {
          const node = edge.node
          if (node) {
            map.set(node.id, {
              id: node.id,
              name: node.name,
              label: node.label,
              descendantCount: node.descendantCount ?? 0,
              descendantTaskCount: node.descendantTaskCount ?? 0,
            })
          }
        }
      }
    } catch (error) {
      console.warn('Failed to fetch folder delete info, falling back to local data', error)
    }

    return map
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

      // Deduplicate: remove entities whose parent folder is also selected
      const selectedIdSet = new Set(fullEntities.map((e) => e.id))
      const topLevelEntities = fullEntities.filter((e) => {
        // For folders: check if parentId is in the selection
        if (e.entityType === 'folder' && 'parentId' in e && e.parentId) {
          return !selectedIdSet.has(e.parentId)
        }
        // For tasks: check if their folder is in the selection
        if ('folderId' in e && e.folderId) {
          return !selectedIdSet.has(e.folderId)
        }
        return true
      })

      const deleteEntities = async (force = false) => {
        // Delete ALL selected entities (not just top-level), the server handles cascading
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

      // Count top-level entities by type
      const counts: Record<string, number> = {}
      for (const e of topLevelEntities) {
        counts[e.entityType] = (counts[e.entityType] || 0) + 1
      }

      const pluralize = (count: number, singular: string): string =>
        `${count} ${count === 1 ? singular : singular + 's'}`

      // Build a descriptive label based on entity types and counts
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

      // Fetch recursive descendant counts for folders
      const topLevelFolders = topLevelEntities.filter((e) => e.entityType === 'folder')
      const folderIds = topLevelFolders.map((f) => f.id)
      const folderInfoMap = await fetchFolderDeleteInfo(folderIds)

      // Build extra details about children that will also be deleted
      const childrenDetails: string[] = []
      for (const folder of topLevelFolders) {
        const info = folderInfoMap.get(folder.id)
        const folderName = `"${folder.label || folder.name}"`

        if (info && (info.descendantCount > 0 || info.descendantTaskCount > 0)) {
          const parts: string[] = []
          if (info.descendantCount > 0) {
            parts.push(pluralize(info.descendantCount, 'child folder'))
          }
          if (info.descendantTaskCount > 0) {
            parts.push(pluralize(info.descendantTaskCount, 'task'))
          }
          childrenDetails.push(`${folderName} contains ${parts.join(' with ')}`)
        } else {
          // Fallback to local data if GQL fetch failed
          if ('hasChildren' in folder && folder.hasChildren) {
            childrenDetails.push(`${folderName} contains child folders`)
          }
          if ('taskNames' in folder && folder.taskNames && folder.taskNames.length > 0) {
            childrenDetails.push(
              `${folderName} contains ${pluralize(folder.taskNames.length, 'task')}`,
            )
          }
        }
      }

      const message = createElement(
        'div',
        null,
        createElement(
          'p',
          null,
          `Are you sure you want to delete ${entityLabel}? This action cannot be undone.`,
        ),
        childrenDetails.length > 0 &&
          createElement(
            'div',
            { style: { marginTop: 12 } },
            createElement(
              'p',
              { style: { fontWeight: 600 } },
              'The following will also be affected:',
            ),
            createElement(
              'ul',
              {
                style: {
                  margin: '4px 0',
                  paddingLeft: 20,
                  maxHeight: 200,
                  overflowY: 'auto' as const,
                },
              },
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
    [getEntityById, updateEntities, onSuccess, projectName, dispatch],
  )

  return handleDeleteEntities
}

export default useDeleteEntities
