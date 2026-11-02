import { ReactNode, useCallback, useMemo, useState } from 'react'
import type { ListEntityType } from '../../components/NewListDialog/NewListDialog'
import { listEntityTypes } from '../../components/NewListDialog/NewListDialogHelpers'
import { toast } from 'react-toastify'
import { ContextMenuItemConstructor } from '@shared/containers/ProjectTreeTable/hooks/useCellContextMenu'
import {
  useUpdateEntityListItemsMutation,
  EntityList,
  useCreateEntityListMutation,
  useExecuteActionMutation,
  useGetReviewablesForEntitiesMutation,
} from '@shared/api'
import { upperFirst } from 'lodash'
import { useSearchParams } from 'react-router-dom'
import { useGetProductionAddon } from '@shared/hooks'
import { getRequestErrorString } from '@shared/util'

import {
  useBuildListMenuItems,
  ListSubMenuItem,
  ListEntityInput,
} from '../../hooks/useBuildListMenuItems'
import AddToListDialog from '../../components/AddToListDialog'
import { EntityListsContext } from './EntityListsContextInstance'

const MIN_REVIEW_VERSION = '0.0.3'
const MIN_REVIEW_ACTIONS_VERSION = '0.5.0'

interface EntityListsContextProps {
  projectName: string
}

// Define a new interface for the newListData state
interface NewListData {
  entityType: ListEntityType
  selectedEntities: ListEntityInput[]
  entityListType?: string
  // folder the dialog starts with (e.g. the folder selected in the list picker)
  entityListFolderId?: string
}

export interface NewListOptions {
  entityListFolderId?: string
}

export type { ListEntityInput, ListSubMenuItem }

export interface EntityListsContextType {
  projectName: string
  hasReviewAddon: boolean
  addToList: (
    listId: string,
    entityType: string,
    entities: ListEntityInput[],
    listEntityListType?: string,
  ) => Promise<void>
  openAddToListDialog: (
    entityType: string,
    entities: ListEntityInput[],
    opts?: { isReview?: boolean; listFilter?: (list: EntityList) => boolean },
  ) => void
  menuItems: (filter?: (item: ListSubMenuItem) => boolean) => ContextMenuItemConstructor
  // Update the type of newListData
  newListData: NewListData | null
  // Update the signature of openCreateNewList
  openCreateNewList: (
    entityType: ListEntityType,
    selectedEntities: ListEntityInput[],
    entityListType?: string,
    options?: NewListOptions,
  ) => void
  closeCreateNewList: () => void
  // Remove entities parameter as it will be stored in newListData
  createNewList: (label: string, options?: NewListOptions) => Promise<void>
  newListErrorMessage?: string
  // Build the full ["Add to list", "Review"] top-level menu items
  buildReviewContextMenu: (
    entityType: ListEntityType,
    entities: ListEntityInput[],
    label?: string,
    filter?: (item: ListSubMenuItem) => boolean,
  ) => any[]
}

interface EntityListsProviderProps extends EntityListsContextProps {
  children: ReactNode
}

export const EntityListsProvider = ({ children, projectName }: EntityListsProviderProps) => {
  const [, setSearchParams] = useSearchParams()

  const { getProductionAddon } = useGetProductionAddon()

  const hasReviewAddon = !!getProductionAddon('review', { minVersion: MIN_REVIEW_VERSION })
  const hasReviewActionsVersion = !!getProductionAddon('review', {
    minVersion: MIN_REVIEW_ACTIONS_VERSION,
  })
  const reviewAddonVersion = getProductionAddon('review')?.productionVersion

  const [updateEntityListItems] = useUpdateEntityListItemsMutation()
  const [executeAction] = useExecuteActionMutation()
  const [getReviewablesForEntities] = useGetReviewablesForEntitiesMutation()

  // The versions a review session gets for the selected entities. Throws when none qualify.
  const getSessionVersions = useCallback(
    async (entityType: string, entities: ListEntityInput[]): Promise<ListEntityInput[]> => {
      let versions: ListEntityInput[]
      if (entityType === 'folder' || entityType === 'task') {
        // `latest` means latest per product, so one folder can return many versions, and the
        // response doesn't say which selected entity a version came from. A session gets one
        // version per selected entity, so ask for each one and keep the first (newest published).
        const results = await Promise.all(
          entities.map((entity) =>
            getReviewablesForEntities({
              projectName,
              entityType: `${entityType}s`,
              reviewablesRequestModel: { entityIds: [entity.entityId] },
              latest: true,
            }).unwrap(),
          ),
        )
        versions = results.flatMap(([newest]) =>
          newest ? [{ entityId: newest.id, entityType: 'version' }] : [],
        )
      } else {
        versions = entities.filter((entity) => entity.hasReviewables !== false)
      }

      if (versions.length === 0) {
        throw new Error('No reviewable versions found for selected entities')
      }

      const skippedCount = entities.length - versions.length
      if (skippedCount > 0) {
        toast.warn(
          skippedCount === 1
            ? `1 ${entityType} skipped (no reviewables)`
            : `${skippedCount} ${entityType}s skipped (no reviewables)`,
        )
      }

      return versions
    },
    [getReviewablesForEntities, projectName],
  )

  // add an item to a list
  const addToList: EntityListsContextType['addToList'] = useCallback(
    async (listId, entityType, entities, listEntityListType) => {
      // check the entity type is valid
      if (!listEntityTypes.includes(entityType as ListEntityType)) {
        toast.error('Invalid entity type')
        return Promise.reject(new Error('Invalid entity type'))
      }

      // filter out entities that do not match entityType
      let filteredEntities = entities.filter((entity) => entity.entityType === entityType)

      // Review sessions logic (caller passes the target list's type; no preloaded list data)
      const isReviewSession = listEntityListType === 'review-session'

      if (isReviewSession) {
        try {
          filteredEntities = await getSessionVersions(entityType, filteredEntities)
        } catch (error: any) {
          toast.error(getRequestErrorString(error) || 'Error adding to session')
          return Promise.reject(error)
        }
      }

      if (filteredEntities.length === 0) {
        toast.error('No entities to add')
        return Promise.reject(new Error('No entities to add'))
      }

      const entitiesToAdd = filteredEntities.map((entity) => ({ entityId: entity.entityId }))

      try {
        await updateEntityListItems({
          listId,
          projectName,
          entityListMultiPatchModel: {
            items: entitiesToAdd,
            mode: 'merge',
          },
        }).unwrap()

        toast.success(
          `Item${entitiesToAdd.length > 1 ? 's' : ''} added to ${isReviewSession ? 'session' : 'list'}`,
        )

        return Promise.resolve()
      } catch (error: any) {
        toast.error(error || 'Error adding to list')
        return Promise.reject(error)
      }
    },
    [
      projectName,
      getSessionVersions,
      updateEntityListItems,
    ],
  )

  const [addToListDialog, setAddToListDialog] = useState<{
    entityType: string
    entities: ListEntityInput[]
    isReview?: boolean
    listFilter?: (list: EntityList) => boolean
  } | null>(null)

  const openAddToListDialog: EntityListsContextType['openAddToListDialog'] = useCallback(
    (entityType, entities, opts) =>
      setAddToListDialog({
        entityType,
        entities,
        isReview: opts?.isReview,
        listFilter: opts?.listFilter,
      }),
    [],
  )

  // Update the state type and initialize as null
  const [newListData, setNewListData] = useState<NewListData | null>(null)

  // Update openCreateNewList to store selected entities
  const openCreateNewList: EntityListsContextType['openCreateNewList'] = useCallback(
    (entityType, selectedEntities, entityListType, options) =>
      setNewListData({
        entityType,
        selectedEntities,
        entityListType,
        entityListFolderId: options?.entityListFolderId,
      }),
    [setNewListData],
  )
  const closeCreateNewList = useCallback(() => setNewListData(null), [setNewListData])

  const [createNewListMutation, { error: newListError }] = useCreateEntityListMutation()
  const newListErrorMessage = getRequestErrorString(newListError)
  // Update createNewList to use entities from newListData state
  const createNewList: EntityListsContextType['createNewList'] = useCallback(
    async (label, options) => {
      const entityListFolderId = options?.entityListFolderId || undefined
      try {
        // Get entities from newListData state
        if (!newListData) {
          toast.error('No entities selected')
          return Promise.reject(new Error('No entities selected'))
        }

        const { selectedEntities, entityListType } = newListData
        const isReviewSession = entityListType === 'review-session'

        // filter out entities that do not match entityType
        let filteredEntities = selectedEntities.filter(
          (entity) => entity.entityType === newListData.entityType,
        )

        if (isReviewSession) {
          filteredEntities = await getSessionVersions(newListData.entityType, filteredEntities)
        }

        // a review session only holds versions, whatever was selected
        const entityType = isReviewSession ? 'version' : newListData.entityType
        const entitiesToAdd = filteredEntities.map((entity) => ({ entityId: entity.entityId }))

        const newListResult = await createNewListMutation({
          projectName,
          entityListPostModel: {
            label,
            entityType,
            entityListType,
            entityListFolderId,
            items: entitiesToAdd,
          },
        }).unwrap()

        const listId = newListResult.id

        if (isReviewSession) {
          toast.success(`Review session ${label} created`)
        } else {
          toast.success(`List ${label} created`)
          toast.success(
            `${upperFirst(entityType)}${entitiesToAdd.length > 1 ? 's' : ''} added to list`,
          )
        }

        // close the dialog
        closeCreateNewList()

        // add list id to search params
        if (listId) {
          setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev)
            newParams.set('list', listId)
            return newParams
          })
        }
      } catch (error: any) {
        toast.error(getRequestErrorString(error) || 'Error creating list')
        return Promise.reject(error)
      }
    },
    [
      projectName,
      closeCreateNewList,
      newListData,
      setSearchParams,
      createNewListMutation,
      getSessionVersions,
    ],
  )

  const { buildReviewContextMenu, menuItems } = useBuildListMenuItems({
    projectName,
    hasReviewAddon,
    hasReviewActionsVersion,
    reviewAddonVersion,
    openCreateNewList,
    openAddToListDialog,
    executeAction,
  })

  const value = useMemo(
    () => ({
      projectName,
      hasReviewAddon,
      addToList,
      openAddToListDialog,
      menuItems,
      newListData,
      openCreateNewList,
      closeCreateNewList,
      createNewList,
      newListErrorMessage,
      buildReviewContextMenu,
    }),
    [
      projectName,
      hasReviewAddon,
      addToList,
      openAddToListDialog,
      menuItems,
      newListData,
      openCreateNewList,
      closeCreateNewList,
      createNewList,
      newListErrorMessage,
      buildReviewContextMenu,
    ],
  )

  return (
    <EntityListsContext.Provider value={value}>
      {children}
      {addToListDialog && (
        <AddToListDialog
          entityType={addToListDialog.entityType}
          entities={addToListDialog.entities}
          projectName={projectName}
          isReview={addToListDialog.isReview}
          listFilter={addToListDialog.listFilter}
          addToList={addToList}
          openCreateNewList={openCreateNewList}
          onClose={() => setAddToListDialog(null)}
        />
      )}
    </EntityListsContext.Provider>
  )
}
