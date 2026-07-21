import { createContext, useContext, ReactNode, useCallback, useMemo, useState } from 'react'
import useGetListsData, { UseGetListsDataReturn } from '../hooks/useGetListsData'
import { ListEntityType, listEntityTypes } from '../components/NewListDialog/NewListDialog'
import { toast } from 'react-toastify'
import { ContextMenuItemConstructor } from '@shared/containers/ProjectTreeTable/hooks/useCellContextMenu'
import {
  useUpdateEntityListItemsMutation,
  EntityList,
  useCreateEntityListMutation,
  EntityListFolderModel,
  useGetEntityListFoldersQuery,
  useExecuteActionMutation,
  entityListsQueriesGql,
  useGetReviewablesForEntitiesMutation,
} from '@shared/api'
import { upperFirst } from 'lodash'
import { useSearchParams } from 'react-router-dom'
import { usePowerpack } from '@shared/context'
import { useGetProductionAddon } from '@shared/hooks'
import { useAppDispatch } from '@state/store'

import {
  useBuildListMenuItems,
  ListSubMenuItem,
  ListEntityInput,
} from '../hooks/useBuildListMenuItems'

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
  allLists: UseGetListsDataReturn
  folders: EntityList[]
  tasks: EntityList[]
  products: EntityList[]
  versions: EntityList[]
  reviews: EntityList[]
  addToList: (listId: string, entityType: string, entities: ListEntityInput[]) => Promise<void>
  menuItems: (filter?: (item: ListSubMenuItem) => boolean) => ContextMenuItemConstructor
  buildListMenuItem: (
    list: EntityList,
    selected: ListEntityInput[],
    showIcon?: boolean,
    disabled?: boolean,
    overrideEntityType?: string,
  ) => ListSubMenuItem
  buildAddToListMenu: (
    items: ListSubMenuItem[],
    menu?: { label?: string },
  ) => {
    id: string
    label: string
    items: ListSubMenuItem[]
  }
  newListMenuItem: (entityType: ListEntityType, selected: ListEntityInput[]) => ListSubMenuItem
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
  // Build hierarchical menu items for arbitrary list collections (folders grouping)
  buildHierarchicalMenuItems: (
    lists: EntityList[],
    selected: ListEntityInput[],
    getShowIcon?: (list: EntityList) => boolean,
    getDisabled?: (list: EntityList) => boolean,
    overrideEntityType?: string,
  ) => ListSubMenuItem[]
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
  const { powerLicense } = usePowerpack()
  const [, setSearchParams] = useSearchParams()

  // Fetch all lists without filters and split on client
  const allLists = useGetListsData({
    projectName,
    filters: [],
    skip: !projectName,
  })

  // Derive individual lists by filtering on client
  const folders = useMemo(
    () => allLists.data.filter((list) => list.entityType === 'folder'),
    [allLists.data],
  )

  const tasks = useMemo(
    () => allLists.data.filter((list) => list.entityType === 'task'),
    [allLists.data],
  )

  const products = useMemo(
    () => allLists.data.filter((list) => list.entityType === 'product'),
    [allLists.data],
  )

  const versions = useMemo(
    () =>
      allLists.data.filter(
        (list) => list.entityType === 'version' && list.entityListType === 'generic',
      ),
    [allLists.data],
  )

  const reviews = useMemo(
    () =>
      allLists.data.filter(
        (list) => list.entityType === 'version' && list.entityListType === 'review-session',
      ),
    [allLists.data],
  )

  // fetch list folders to build hierarchy (only needed when power license)
  const { data: listFoldersAll = [] } = useGetEntityListFoldersQuery(
    { projectName },
    { skip: !projectName || !powerLicense },
  )

  // no filtering by scope here (UI using this context is overview page)
  const listFolders = listFoldersAll as EntityListFolderModel[]

  const { getProductionAddon } = useGetProductionAddon()

  const hasReviewAddon = !!getProductionAddon('review', { minVersion: MIN_REVIEW_VERSION })
  const hasReviewActionsVersion = !!getProductionAddon('review', {
    minVersion: MIN_REVIEW_ACTIONS_VERSION,
  })
  const reviewAddonVersion = getProductionAddon('review')?.productionVersion

  const [updateEntityListItems] = useUpdateEntityListItemsMutation()
  const [executeAction] = useExecuteActionMutation()
  const [getReviewablesForEntities] = useGetReviewablesForEntitiesMutation()

  const getReviewableVersions = useCallback(
    async (entityType: 'folder' | 'task', entities: ListEntityInput[]) => {
      const result = await getReviewablesForEntities({
        projectName,
        entityType: `${entityType}s`,
        reviewablesRequestModel: {
          entityIds: entities.map((entity) => entity.entityId),
        },
        latest: true,
      }).unwrap()

      return result.map((version) => ({
        entityId: version.id,
        entityType: 'version',
      }))
    },
    [getReviewablesForEntities, projectName],
  )

  const invalidateListCaches = useCallback(
    (listId?: string) => {
      dispatch(
        entityListsQueriesGql.util.invalidateTags([
          { type: 'entityList', id: 'LIST' },
          ...(listId
            ? [
                { type: 'entityList', id: listId },
                { type: 'entityListItem', id: listId },
                { type: 'entityListItemsColumnStats', id: listId },
              ]
            : []),
        ]),
      )
    },
    [dispatch],
  )

  // add an item to a list
  const addToList: EntityListsContextType['addToList'] = useCallback(
    async (listId, entityType, entities) => {
      // check the entity type is valid
      if (!listEntityTypes.includes(entityType as ListEntityType)) {
        toast.error('Invalid entity type')
        return Promise.reject(new Error('Invalid entity type'))
      }

      // filter out entities that do not match entityType
      let filteredEntities = entities.filter((entity) => entity.entityType === entityType)

      // Review sessions logic
      const targetList = allLists.data.find((l) => l.id === listId)
      const isReviewSession = targetList?.entityListType === 'review-session'

      if (isReviewSession && (entityType === 'folder' || entityType === 'task')) {
        const selectedEntityCount = filteredEntities.length

        try {
          filteredEntities = await getReviewableVersions(entityType, filteredEntities)
        } catch (error: any) {
          console.error('Error getting reviewables for session', error)
          toast.error(error?.data?.detail || error?.message || 'Error getting reviewables')
          return Promise.reject(error)
        }

        const skippedCount = selectedEntityCount - filteredEntities.length
        if (filteredEntities.length === 0) {
          toast.error('No reviewable versions found for selected entities')
          return Promise.reject(new Error('No reviewable versions found'))
        }
        if (skippedCount > 0) {
          toast.warn(
            skippedCount === 1
              ? '1 selected entity skipped (no reviewables)'
              : `${skippedCount} selected entities skipped (no reviewables)`,
          )
        }
      }

      if (isReviewSession && entityType === 'version') {
        const eligible = filteredEntities.filter((entity) => entity.hasReviewables !== false)
        const skippedCount = filteredEntities.length - eligible.length
        if (eligible.length === 0) {
          toast.error('No reviewable versions found for selected entities')
          return Promise.reject(new Error('No reviewable versions found'))
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

        if (isReviewSession) invalidateListCaches(listId)

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
      allLists.data,
      getReviewableVersions,
      invalidateListCaches,
      updateEntityListItems,
    ],
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

        const { selectedEntities, entityListType } = newListData
        let { entityType } = newListData

        // filter out entities that do not match entityType
        let filteredEntities = selectedEntities.filter((entity) => entity.entityType === entityType)

        if (
          entityListType === 'review-session' &&
          (entityType === 'folder' || entityType === 'task')
        ) {
          const selectedEntityCount = filteredEntities.length
          filteredEntities = await getReviewableVersions(entityType, filteredEntities)
          const skippedCount = selectedEntityCount - filteredEntities.length
          if (filteredEntities.length === 0) {
            throw new Error('No reviewable versions found for selected entities')
          }
          if (skippedCount > 0) {
            toast.warn(
              skippedCount === 1
                ? '1 selected entity skipped (no reviewables)'
                : `${skippedCount} selected entities skipped (no reviewables)`,
            )
          }
          entityType = 'version'
        }

        if (entityListType === 'review-session' && entityType === 'version') {
          const eligible = filteredEntities.filter((entity) => entity.hasReviewables !== false)
          const skippedCount = filteredEntities.length - eligible.length
          if (skippedCount > 0) {
            toast.warn(
              skippedCount === 1
                ? '1 version skipped (no reviewables)'
                : `${skippedCount} versions skipped (no reviewables)`,
            )
          }
          filteredEntities = eligible
        }

        if (entityListType === 'review-session' && filteredEntities.length === 0) {
          throw new Error('No reviewable versions found for selected entities')
        }

        const entitiesToAdd = filteredEntities.map((entity) => ({ entityId: entity.entityId }))

        let listId: string | undefined

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
        invalidateListCaches(listId)

        toast.success(`List ${label} created`)
        toast.success(
          `${upperFirst(entityType)}${entitiesToAdd.length > 1 ? 's' : ''} added to list`,
        )

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
      getReviewableVersions,
      invalidateListCaches,
    ],
  )

  const {
    newListMenuItem,
    buildListMenuItem,
    buildAddToListMenu,
    buildHierarchicalMenuItems,
    buildReviewContextMenu,
    menuItems,
  } = useBuildListMenuItems({
    projectName,
    powerLicense,
    hasReviewAddon,
    hasReviewActionsVersion,
    reviewAddonVersion,
    listFolders,
    folders,
    tasks,
    products,
    versions,
    reviews,
    addToList,
    openCreateNewList,
    executeAction,
  })

  const value = useMemo(
    () => ({
      allLists,
      folders,
      tasks,
      products,
      versions,
      reviews,
      addToList,
      menuItems,
      buildListMenuItem,
      buildAddToListMenu,
      newListMenuItem,
      newListData,
      openCreateNewList,
      closeCreateNewList,
      createNewList,
      newListErrorMessage,
      buildHierarchicalMenuItems,
      buildReviewContextMenu,
    }),
    [
      allLists,
      folders,
      tasks,
      products,
      versions,
      reviews,
      addToList,
      menuItems,
      buildListMenuItem,
      buildAddToListMenu,
      newListMenuItem,
      newListData,
      openCreateNewList,
      closeCreateNewList,
      createNewList,
      newListErrorMessage,
      buildHierarchicalMenuItems,
      buildReviewContextMenu,
    ],
  )

  return <EntityListsContext.Provider value={value}>{children}</EntityListsContext.Provider>
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
