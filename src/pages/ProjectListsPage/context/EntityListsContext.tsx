import { createContext, useContext, ReactNode, useCallback, useMemo, useState } from 'react'
import { ListEntityType, listEntityTypes } from '../components/NewListDialog/NewListDialog'
import { toast } from 'react-toastify'
import { ContextMenuItemConstructor } from '@shared/containers/ProjectTreeTable/hooks/useCellContextMenu'
import {
  useUpdateEntityListItemsMutation,
  EntityList,
  useCreateEntityListMutation,
  useExecuteActionMutation,
  entityListsQueriesGql,
} from '@shared/api'
import { upperFirst } from 'lodash'
import { useSearchParams } from 'react-router-dom'
import { useGetProductionAddon } from '@shared/hooks'
import { useAppDispatch } from '@state/store'

import {
  useBuildListMenuItems,
  ListSubMenuItem,
  ListEntityInput,
} from '../hooks/useBuildListMenuItems'
import AddToListDialog from '../components/AddToListDialog'

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
}

export type { ListEntityInput, ListSubMenuItem }

export interface EntityListsContextType {
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
  ) => void
  closeCreateNewList: () => void
  // Remove entities parameter as it will be stored in newListData
  createNewList: (label: string) => Promise<void>
  newListErrorMessage?: string
  // Build the full ["Add to list", "Review"] top-level menu items
  buildReviewContextMenu: (
    entityType: ListEntityType,
    entities: ListEntityInput[],
    label?: string,
    filter?: (item: ListSubMenuItem) => boolean,
  ) => any[]
}

const EntityListsContext = createContext<EntityListsContextType | undefined>(undefined)

interface EntityListsProviderProps extends EntityListsContextProps {
  children: ReactNode
}

export const EntityListsProvider = ({ children, projectName }: EntityListsProviderProps) => {
  const dispatch = useAppDispatch()
  const [, setSearchParams] = useSearchParams()

  const { getProductionAddon } = useGetProductionAddon()

  const hasReviewAddon = !!getProductionAddon('review', { minVersion: MIN_REVIEW_VERSION })
  const hasReviewActionsVersion = !!getProductionAddon('review', {
    minVersion: MIN_REVIEW_ACTIONS_VERSION,
  })
  const reviewAddonVersion = getProductionAddon('review')?.productionVersion

  const [updateEntityListItems] = useUpdateEntityListItemsMutation()
  const [executeAction] = useExecuteActionMutation()

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

      if (isReviewSession && (entityType === 'folder' || entityType === 'task')) {
        if (!reviewAddonVersion) {
          toast.error('Review addon not available')
          return Promise.reject(new Error('Review addon not available'))
        }

        if (!hasReviewActionsVersion) {
          toast.error(
            `Please upgrade Review addon to at least ${MIN_REVIEW_ACTIONS_VERSION} to use this feature with folders and tasks`,
          )
          return Promise.reject(new Error('Review addon version too low'))
        }

        try {
          const actionIdentifier = `review-add-to-session-from-${entityType}s`
          const result = await executeAction({
            identifier: actionIdentifier,
            actionContext: {
              projectName,
              entityType,
              entityIds: filteredEntities.map((e) => e.entityId),
              // Pass the target list ID as list_id in formData
              formData: { list_id: listId },
            },
            addonName: 'review',
            addonVersion: reviewAddonVersion,
          }).unwrap()

          if (result.success) {
            if (result.payload) {
              // invalidate the list caches
              const tags = [
                { type: 'entityList', id: listId },
                { type: 'entityListItem', id: listId },
                { type: 'entityListItemsColumnStats', id: listId },
              ]
              dispatch(entityListsQueriesGql.util.invalidateTags(tags))
            }
            toast.success(`Item${filteredEntities.length > 1 ? 's' : ''} added to session`)
            return Promise.resolve()
          } else {
            throw new Error(result.message || 'Error adding to session')
          }
        } catch (error: any) {
          console.error('Error adding to session via action', error)
          toast.error(error?.data?.detail || error?.message || 'Error adding to session')
          return Promise.reject(error)
        }
      }

      // Default review session logic for versions: only accept versions with reviewables
      if (isReviewSession && entityType === 'version') {
        const eligible = filteredEntities.filter((e) => e.hasReviewables !== false)
        const skippedCount = filteredEntities.length - eligible.length
        if (skippedCount > 0 && eligible.length === 0) {
          toast.error(
            skippedCount === 1
              ? 'Cannot add version without reviewables to review session'
              : `Cannot add ${skippedCount} versions without reviewables to review session`,
          )
          return Promise.reject(new Error('No reviewable versions to add'))
        }
        if (skippedCount > 0) {
          toast.warn(
            skippedCount === 1
              ? '1 version skipped (no reviewables)'
              : `${skippedCount} versions skipped (no reviewables)`,
          )
        }
        filteredEntities = eligible
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

        toast.success(`Item${entitiesToAdd.length > 1 ? 's' : ''} added to list`)

        return Promise.resolve()
      } catch (error: any) {
        console.error('Error adding to list', error)
        toast.error(error || 'Error adding to list')
        return Promise.reject(error)
      }
    },
    [
      projectName,
      reviewAddonVersion,
      hasReviewActionsVersion,
      executeAction,
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
  const openCreateNewList = useCallback(
    (entityType: ListEntityType, selectedEntities: ListEntityInput[], entityListType?: string) =>
      setNewListData({ entityType, selectedEntities, entityListType }),
    [setNewListData],
  )
  const closeCreateNewList = useCallback(() => setNewListData(null), [setNewListData])

  const [createNewListMutation, { error: newListError }] = useCreateEntityListMutation()
  // @ts-expect-error - we just know the error is an object
  const newListErrorMessage = newListError?.data?.detail as string
  // Update createNewList to use entities from newListData state
  const createNewList: EntityListsContextType['createNewList'] = useCallback(
    async (label) => {
      try {
        // Get entities from newListData state
        if (!newListData) {
          toast.error('No entities selected')
          return Promise.reject(new Error('No entities selected'))
        }

        const { selectedEntities, entityType, entityListType } = newListData

        // filter out entities that do not match entityType
        const filteredEntities = selectedEntities.filter(
          (entity) => entity.entityType === entityType,
        )

        const entitiesToAdd = filteredEntities.map((entity) => ({ entityId: entity.entityId }))

        let listId: string | undefined

        // For review sessions from folders or tasks, use the specialized action
        if (
          entityListType === 'review-session' &&
          (entityType === 'folder' || entityType === 'task')
        ) {
          if (!reviewAddonVersion) {
            toast.error('Review addon not available')
            return Promise.reject(new Error('Review addon not available'))
          }

          if (!hasReviewActionsVersion) {
            toast.error(
              `Please upgrade Review addon to at least ${MIN_REVIEW_ACTIONS_VERSION} to use this feature with folders and tasks`,
            )
            return Promise.reject(new Error('Review addon version too low'))
          }

          const actionIdentifier = `review-save-session-from-${entityType}`
          const result = await executeAction({
            identifier: actionIdentifier,
            actionContext: {
              projectName,
              entityType,
              entityIds: entitiesToAdd.map((e) => e.entityId),
              // Passing label to the action as it might be required for naming the session
              formData: { label },
            },
            addonName: 'review',
            addonVersion: reviewAddonVersion,
          }).unwrap()

          if (!result.success) {
            throw new Error(result.message || 'Error creating review session from action')
          }

          const payloadData = (result.payload as any)?.data
          // Try to extract created ID if provided, though standard behavior might vary
          listId = payloadData?.id

          if (payloadData) {
            // invalidate the list caches
            const tags = [
              { type: 'entityList', id: listId },
              { type: 'entityListItemsColumnStats', id: listId },
            ]
            dispatch(entityListsQueriesGql.util.invalidateTags(tags))
          }

          toast.success(`Review session ${label} created`)
        } else {
          // Default: create via entity list mutation (used for versions and generic lists)
          const newListResult = await createNewListMutation({
            projectName,
            entityListPostModel: {
              label,
              entityType,
              entityListType,
              items: entitiesToAdd,
            },
          }).unwrap()

          listId = newListResult.id

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
        console.error('Error creating list', error)
        toast.error(error?.data?.detail || error?.message || 'Error creating list')
        return Promise.reject(error)
      }
    },
    [
      projectName,
      closeCreateNewList,
      newListData,
      setSearchParams,
      createNewListMutation,
      executeAction,
      reviewAddonVersion,
      hasReviewActionsVersion,
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

export const useEntityListsContext = () => {
  const context = useContext(EntityListsContext)
  if (context === undefined) {
    throw new Error('useEntityListsContext must be used within an EntityListsProvider')
  }
  return context
}

export const useOptionalEntityListsContext = () => useContext(EntityListsContext)

export default EntityListsContext
