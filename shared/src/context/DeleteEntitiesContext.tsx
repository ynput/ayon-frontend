import { createContext, useCallback, useContext, ReactNode } from 'react'
import { toast } from 'react-toastify'
import { confirmDelete } from '@shared/util'
import {
  useUpdateOverviewEntitiesMutation,
  useLazyGetFolderDeleteInfoQuery,
  type OperationModel,
} from '@shared/api'
import {
  DeleteConfirmContent,
  buildChildrenDetails,
  buildEntityLabel,
} from '@shared/components/DeleteEntitiesConfirm'

export type DeletableEntityType =
  | 'folder'
  | 'task'
  | 'product'
  | 'version'
  | 'representation'
  | 'workfile'

const DELETABLE_ENTITY_TYPES = new Set<string>([
  'folder',
  'task',
  'product',
  'version',
  'representation',
  'workfile',
])

export const isDeletableEntityType = (type?: string): type is DeletableEntityType =>
  !!type && DELETABLE_ENTITY_TYPES.has(type)

export interface DeletableEntity {
  id: string
  entityType: DeletableEntityType
  name?: string
  label?: string | null
  projectName: string
  // parent references — used to drop descendants when an ancestor is also selected
  folderId?: string // task / product parent folder
  parentId?: string // folder parent folder
  // local fallbacks used when the folder delete-info fetch is unavailable
  hasChildren?: boolean
  taskNames?: string[]
}

export interface DeleteEntitiesOptions {
  onSuccess?: () => void
}

interface DeleteEntitiesContextValue {
  // resolves when the confirmation dialog opens, not when deletion finishes — use onSuccess
  deleteEntities: (entities: DeletableEntity[], options?: DeleteEntitiesOptions) => Promise<void>
}

const DeleteEntitiesContext = createContext<DeleteEntitiesContextValue | null>(null)

// operations run sequentially on the server — delete children before their parents
const DELETE_OP_ORDER: DeletableEntityType[] = [
  'representation',
  'version',
  'workfile',
  'product',
  'task',
  'folder',
]
const FOLDER_WITH_CHILDREN_CODE = 'delete-folder-with-children'

export const DeleteEntitiesProvider = ({ children }: { children: ReactNode }) => {
  const [operations] = useUpdateOverviewEntitiesMutation()
  const [fetchFolderDeleteInfo] = useLazyGetFolderDeleteInfoQuery()

  const deleteEntities = useCallback<DeleteEntitiesContextValue['deleteEntities']>(
    async (entities, options) => {
      if (!entities || entities.length === 0) {
        toast.error('No entities selected')
        return
      }

      // dedupe by id
      const seen = new Set<string>()
      const uniqueEntities = entities.filter((e) => {
        if (!e?.id || seen.has(e.id)) return false
        seen.add(e.id)
        return true
      })

      if (uniqueEntities.length === 0) {
        toast.error('No entities found')
        return
      }

      // drop descendants whose ancestor is also selected — avoids double-deletes / double-counts
      const selectedIdSet = new Set(uniqueEntities.map((e) => e.id))
      const topLevel = uniqueEntities.filter((e) => {
        if (e.entityType === 'folder' && e.parentId) return !selectedIdSet.has(e.parentId)
        if ((e.entityType === 'task' || e.entityType === 'product') && e.folderId) {
          return !selectedIdSet.has(e.folderId)
        }
        return true
      })

      // one batched operations request per project — caches are patched optimistically
      // by the mutation and rolled back automatically if the request fails
      const runOperationsDelete = async (
        entitiesToDelete: DeletableEntity[],
        force: boolean,
      ) => {
        if (entitiesToDelete.length === 0) return

        const byProject = new Map<string, DeletableEntity[]>()
        for (const e of entitiesToDelete) {
          const group = byProject.get(e.projectName) || []
          group.push(e)
          byProject.set(e.projectName, group)
        }

        await Promise.all(
          Array.from(byProject.entries()).map(([projectName, group]) => {
            const sorted = [...group].sort(
              (a, b) =>
                DELETE_OP_ORDER.indexOf(a.entityType) - DELETE_OP_ORDER.indexOf(b.entityType),
            )
            const ops: OperationModel[] = sorted.map((e) => ({
              type: 'delete',
              entityType: e.entityType,
              entityId: e.id,
              force,
            }))
            return operations({
              operationsRequestModel: { operations: ops },
              projectName,
            }).unwrap()
          }),
        )
      }

      const runDelete = async () => {
        try {
          await runOperationsDelete(topLevel, false)
          options?.onSuccess?.()
        } catch (error: any) {
          const message = error?.error || 'Failed to delete entities'
          console.error('Failed to delete entities:', error)
          throw { message, ...error }
        }
      }

      // force only applies to folders — everything else either succeeded on the first
      // attempt or is deleted by the folder cascade
      const runForceDelete = () =>
        runOperationsDelete(
          topLevel.filter((e) => e.entityType === 'folder' || e.entityType === 'task'),
          true,
        )

      // fetch child counts for top-level folders (grouped per project) to show what else gets deleted
      const topLevelFolders = topLevel.filter((e) => e.entityType === 'folder')
      let childrenDetails: string[] = []
      if (topLevelFolders.length > 0) {
        const foldersByProject = new Map<string, DeletableEntity[]>()
        for (const f of topLevelFolders) {
          const group = foldersByProject.get(f.projectName) || []
          group.push(f)
          foldersByProject.set(f.projectName, group)
        }
        try {
          const infoLists = await Promise.all(
            Array.from(foldersByProject.entries()).map(([projectName, group]) =>
              fetchFolderDeleteInfo({
                projectName,
                folderIds: group.map((f) => f.id),
              }).unwrap(),
            ),
          )
          childrenDetails = buildChildrenDetails(topLevelFolders, infoLists.flat())
        } catch (error) {
          console.warn('Failed to fetch folder delete info, falling back to local data', error)
          childrenDetails = buildChildrenDetails(topLevelFolders, [])
        }
      }

      // products cascade to their versions on the backend — warn about it
      const productCount = topLevel.filter((e) => e.entityType === 'product').length
      if (productCount > 0) {
        childrenDetails.push(
          productCount > 1
            ? 'Deleting these products also deletes all their versions'
            : 'Deleting this product also deletes all its versions',
        )
      }

      const entityLabel = buildEntityLabel(topLevel)

      confirmDelete({
        label: entityLabel,
        message: <DeleteConfirmContent entityLabel={entityLabel} childrenDetails={childrenDetails} />,
        accept: runDelete,
        onError: (error: any) => {
          if (error?.errorCodes?.includes(FOLDER_WITH_CHILDREN_CODE)) {
            const confirmForce = window.confirm(
              `Are you really sure you want to delete ${entityLabel} and all of its dependencies? This cannot be undone. (NOT RECOMMENDED)`,
            )
            if (confirmForce) {
              runForceDelete()
                .then(() => options?.onSuccess?.())
                .catch((forceError: any) => {
                  console.error('Failed to force delete entities:', forceError)
                  toast.error(forceError?.error || 'Failed to delete entities')
                })
            }
          }
        },
        deleteLabel: 'Delete forever',
      })
    },
    [operations, fetchFolderDeleteInfo],
  )

  return (
    <DeleteEntitiesContext.Provider value={{ deleteEntities }}>
      {children}
    </DeleteEntitiesContext.Provider>
  )
}

export const useDeleteEntitiesContext = (): DeleteEntitiesContextValue => {
  const ctx = useContext(DeleteEntitiesContext)
  if (!ctx) {
    throw new Error('useDeleteEntitiesContext must be used within a DeleteEntitiesProvider')
  }
  return ctx
}

// non-throwing variant for optional consumers (e.g. menus that may render outside the provider)
export const useDeleteEntitiesContextOptional = (): DeleteEntitiesContextValue | null =>
  useContext(DeleteEntitiesContext)
