import { useCallback, createElement, useState, useEffect } from 'react'
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
  totalFolderCount: number
  totalTaskCount: number
  totalProductCount: number
  totalVersionCount: number
}

const pluralize = (count: number, singular: string): string =>
  `${count} ${count === 1 ? singular : singular + 's'}`

// Component that shows skeleton while loading, then actual counts
const DeleteConfirmContent = ({
  entityLabel,
  topLevelFolders,
  fetchDeleteInfo,
}: {
  entityLabel: string
  topLevelFolders: (EntityMap & { rowId: string })[]
  fetchDeleteInfo: (folderIds: string[]) => Promise<Map<string, FolderDeleteInfo>>
}) => {
  const [loading, setLoading] = useState(topLevelFolders.length > 0)
  const [childrenDetails, setChildrenDetails] = useState<string[]>([])

  useEffect(() => {
    if (topLevelFolders.length === 0) return

    const folderIds = topLevelFolders.map((f) => f.id)
    fetchDeleteInfo(folderIds)
      .then((folderInfoMap) => {
        const details: string[] = []
        for (const folder of topLevelFolders) {
          const info = folderInfoMap.get(folder.id)
          const folderName = `"${folder.label || folder.name}"`

          const hasDescendants =
            info &&
            (info.totalFolderCount > 0 ||
              info.totalTaskCount > 0 ||
              info.totalProductCount > 0 ||
              info.totalVersionCount > 0)

          if (hasDescendants) {
            const parts: string[] = []
            if (info.totalFolderCount > 0) {
              parts.push(pluralize(info.totalFolderCount, 'child folder'))
            }
            if (info.totalTaskCount > 0) {
              parts.push(pluralize(info.totalTaskCount, 'task'))
            }
            if (info.totalProductCount > 0) {
              parts.push(pluralize(info.totalProductCount, 'product'))
            }
            if (info.totalVersionCount > 0) {
              parts.push(pluralize(info.totalVersionCount, 'version'))
            }
            details.push(`${folderName} contains ${parts.join(', ')}`)
          } else {
            // Fallback to local data if GQL fetch failed
            if ('hasChildren' in folder && folder.hasChildren) {
              details.push(`${folderName} contains child folders`)
            }
            if ('taskNames' in folder && folder.taskNames && folder.taskNames.length > 0) {
              details.push(
                `${folderName} contains ${pluralize(folder.taskNames.length, 'task')}`,
              )
            }
          }
        }
        setChildrenDetails(details)
      })
      .catch(() => {
        // Fallback: use local data
        const details: string[] = []
        for (const folder of topLevelFolders) {
          const folderName = `"${folder.label || folder.name}"`
          if ('hasChildren' in folder && folder.hasChildren) {
            details.push(`${folderName} contains child folders`)
          }
          if ('taskNames' in folder && folder.taskNames && folder.taskNames.length > 0) {
            details.push(
              `${folderName} contains ${pluralize(folder.taskNames.length, 'task')}`,
            )
          }
        }
        setChildrenDetails(details)
      })
      .finally(() => setLoading(false))
  }, [])

  const skeletonStyle = {
    height: 14,
    borderRadius: 4,
    background: 'var(--md-sys-color-surface-container-high)',
    animation: 'pulse 1.5s ease-in-out infinite',
  }

  // Fixed dimensions to prevent layout shift between loading and loaded states
  const detailsContainerStyle = {
    marginTop: 12,
    minHeight: 60,
    minWidth: 350,
  }

  return createElement(
    'div',
    { style: { minWidth: 350 } },
    createElement(
      'style',
      null,
      '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }',
    ),
    createElement(
      'p',
      null,
      `Are you sure you want to delete ${entityLabel}? This action cannot be undone.`,
    ),
    topLevelFolders.length > 0 &&
      createElement(
        'div',
        { style: detailsContainerStyle },
        loading
          ? createElement(
              'div',
              null,
              createElement(
                'p',
                { style: { fontWeight: 600 } },
                'Loading affected items...',
              ),
              createElement('div', {
                style: { ...skeletonStyle, width: '80%', marginBottom: 6 },
              }),
              createElement('div', {
                style: { ...skeletonStyle, width: '60%' },
              }),
            )
          : childrenDetails.length > 0
            ? createElement(
                'div',
                null,
                createElement(
                  'p',
                  { style: { fontWeight: 600 } },
                  'The following will also be affected:',
                ),
                ...childrenDetails.map((detail, i) =>
                  createElement('p', { key: i }, detail),
                ),
              )
            : null,
      ),
  )
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
  const fetchFolderDeleteInfo = async (
    folderIds: string[],
  ): Promise<Map<string, FolderDeleteInfo>> => {
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
              totalFolderCount: node.totalFolderCount ?? 0,
              totalTaskCount: node.totalTaskCount ?? 0,
              totalProductCount: node.totalProductCount ?? 0,
              totalVersionCount: node.totalVersionCount ?? 0,
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

      const topLevelFolders = topLevelEntities.filter((e) => e.entityType === 'folder')

      // Show dialog immediately with skeleton, fetch counts in background
      const message = createElement(DeleteConfirmContent, {
        entityLabel,
        topLevelFolders,
        fetchDeleteInfo: fetchFolderDeleteInfo,
      })

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