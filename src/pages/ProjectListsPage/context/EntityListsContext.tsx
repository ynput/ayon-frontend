import { createContext, useContext, ReactNode, useCallback, useMemo, useState } from 'react'
import useGetListsData, { UseGetListsDataReturn } from '../hooks/useGetListsData'
import { ListEntityType, listEntityTypes } from '../components/NewListDialog/NewListDialog'
import { toast } from 'react-toastify'
import { getEntityTypeIcon } from '@shared/util'
import { ContextMenuItemConstructor } from '@shared/containers/ProjectTreeTable/hooks/useCellContextMenu'
import {
  useUpdateEntityListItemsMutation,
  EntityList,
  useCreateEntityListMutation,
} from '@shared/api'
import { upperFirst } from 'lodash'
import { useSearchParams } from 'react-router-dom'

interface EntityListsContextProps {
  entityTypes: ListEntityType[]
  projectName: string
}

// Define a new interface for the newListData state
interface NewListData {
  entityType: ListEntityType
  selectedEntities: { entityId: string; entityType: string | undefined }[]
}

type ListSubMenuItem = {
  id: string
  label: string
  icon?: string
  command: () => void
}

export interface EntityListsContextType {
  folders: UseGetListsDataReturn
  tasks: UseGetListsDataReturn
  products: UseGetListsDataReturn
  versions: UseGetListsDataReturn
  reviews: UseGetListsDataReturn
  addToList: (
    listId: string,
    entityType: string,
    entities: { entityId: string; entityType: string | undefined }[],
  ) => Promise<void>
  menuItems: (filter?: (item: ListSubMenuItem) => boolean) => ContextMenuItemConstructor
  buildListMenuItem: (
    list: EntityList,
    selected: { entityId: string; entityType: string | undefined }[],
    showIcon?: boolean,
  ) => ListSubMenuItem
  buildAddToListMenu: (
    items: ListSubMenuItem[],
    menu?: { label?: string },
  ) => {
    id: string
    label: string
    icon: string
    items: ListSubMenuItem[]
  }
  newListMenuItem: (
    entityType: ListEntityType,
    selected: { entityId: string; entityType: string | undefined }[],
  ) => ListSubMenuItem
  // Update the type of newListData
  newListData: NewListData | null
  // Update the signature of openCreateNewList
  openCreateNewList: (
    entityType: ListEntityType,
    selectedEntities: { entityId: string; entityType: string | undefined }[],
  ) => void
  closeCreateNewList: () => void
  // Remove entities parameter as it will be stored in newListData
  createNewList: (label: string) => Promise<void>
  newListErrorMessage?: string
}

const EntityListsContext = createContext<EntityListsContextType | undefined>(undefined)

interface EntityListsProviderProps extends EntityListsContextProps {
  children: ReactNode
}

const getFilter = (entityType: string) => [
  { id: 'entityType', operator: 'OR', values: [{ id: entityType }] },
]

export const EntityListsProvider = ({
  children,
  entityTypes = [],
  projectName,
}: EntityListsProviderProps) => {
  const [, setSearchParams] = useSearchParams()

  // FOLDERS
  const folders = useGetListsData({
    projectName,
    filters: getFilter('folder'),
    skip: !entityTypes.includes('folder'),
  })

  //TASKS
  const tasks = useGetListsData({
    projectName,
    filters: getFilter('task'),
    skip: !entityTypes.includes('task'),
  })
  //PRODUCTS
  const products = useGetListsData({
    projectName,
    filters: getFilter('product'),
    // @ts-expect-error - product is not a valid entityType
    skip: !entityTypes.includes('product'),
  })
  //VERSIONS
  const versions = useGetListsData({
    projectName,
    filters: getFilter('version'),
    skip: !entityTypes.includes('version'),
    entityListTypes: ['generic'],
  })
  // REVIEWS
  const reviews = useGetListsData({
    projectName,
    filters: getFilter('version'),
    skip: !entityTypes.includes('version'),
    entityListTypes: ['review-session'],
  })

  const [updateEntityListItems] = useUpdateEntityListItemsMutation()

  // add an item to a list
  const addToList: EntityListsContextType['addToList'] = useCallback(
    async (listId, entityType, entities) => {
      // check the entity type is valid
      if (!listEntityTypes.includes(entityType as ListEntityType)) {
        toast.error('Invalid entity type')
        return Promise.reject(new Error('Invalid entity type'))
      }

      // filter out entities that do not match entityType
      const filteredEntities = entities.filter((entity) => entity.entityType === entityType)

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
        })

        toast.success(`Item${entitiesToAdd.length > 1 ? 's' : ''} added to list`)

        return Promise.resolve()
      } catch (error) {
        toast.error('Error adding to list')
        return Promise.reject(error)
      }
    },
    [projectName],
  )

  // Update the state type and initialize as null
  const [newListData, setNewListData] = useState<NewListData | null>(null)

  // Update openCreateNewList to store selected entities
  const openCreateNewList = useCallback(
    (
      entityType: ListEntityType,
      selectedEntities: { entityId: string; entityType: string | undefined }[],
    ) => setNewListData({ entityType, selectedEntities }),
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

        const { selectedEntities, entityType } = newListData

        // filter out entities that do not match entityType
        const filteredEntities = selectedEntities.filter(
          (entity) => entity.entityType === entityType,
        )

        const entitiesToAdd = filteredEntities.map((entity) => ({ entityId: entity.entityId }))

        const newListResult = await createNewListMutation({
          projectName,
          entityListPostModel: {
            label,
            entityType,
            items: entitiesToAdd,
          },
        }).unwrap()

        // close the dialog
        closeCreateNewList()
        toast.success(`List ${label} created`)
        toast.success(
          `${upperFirst(entityType)}${entitiesToAdd.length > 1 ? 's' : ''} added to list`,
        )

        // add list id to search params
        const listId = newListResult.id
        if (listId) {
          setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev)
            newParams.set('list', listId)
            return newParams
          })
        }
      } catch (error) {
        return Promise.reject(error)
      }
    },
    [projectName, closeCreateNewList, newListData, setSearchParams],
  )

  const newListMenuItem = useCallback<EntityListsContextType['newListMenuItem']>(
    (entityType, selected) => ({
      id: '__new-list__',
      label: 'New list',
      icon: 'add',
      command: () => openCreateNewList(entityType, selected),
    }),
    [openCreateNewList],
  )

  const getListIcon = (entityType: string, entityListType: string) => {
    if (entityListType === 'review-session') {
      return 'subscriptions'
    } else {
      return getEntityTypeIcon(entityType)
    }
  }

  const buildListMenuItem: EntityListsContextType['buildListMenuItem'] = useCallback(
    (list, selected, showIcon?) => ({
      id: list.id,
      label: list.label,
      icon: showIcon ? getListIcon(list.entityType, list.entityListType) : undefined,
      command: () =>
        addToList(
          list.id,
          list.entityType,
          selected.map((i) => ({ entityId: i.entityId, entityType: i.entityType })),
        ),
    }),
    [addToList],
  )

  const buildAddToListMenu: EntityListsContextType['buildAddToListMenu'] = useCallback(
    (items, menu) => {
      return {
        id: 'add-to-list',
        label: menu?.label || 'Add to list',
        icon: 'list_alt_add',
        items: items,
      }
    },
    [],
  )

  const menuItems: EntityListsContextType['menuItems'] = useCallback(
    (filter) => (_e, cell, selected, _meta) => {
      const isMultipleEntityTypes = selected.some(
        (item) => item.entityType !== selected[0].entityType,
      )

      const foldersMenuItems = folders.data.map((folder) =>
        buildListMenuItem(folder, selected, isMultipleEntityTypes),
      )

      const tasksMenuItems = tasks.data.map((task) =>
        buildListMenuItem(task, selected, isMultipleEntityTypes),
      )

      const productsMenuItems = products.data.map((product) =>
        buildListMenuItem(product, selected, isMultipleEntityTypes),
      )

      const versionsMenuItems = versions.data.map((version) =>
        buildListMenuItem(version, selected, !!reviews.data.length),
      )

      const reviewsMenuItems = reviews.data.map((review) =>
        buildListMenuItem(review, selected, true),
      )

      let subMenuItems: ListSubMenuItem[] = []

      if (cell.isGroup) {
        // If the cell is a group, we don't show the add to list menu
        return []
      } else if (isMultipleEntityTypes) {
        subMenuItems = [...foldersMenuItems, ...tasksMenuItems]
      } else if (cell.entityType === 'folder') {
        subMenuItems = foldersMenuItems
      } else if (cell.entityType === 'task') {
        subMenuItems = tasksMenuItems
      } else if (cell.entityType === 'product') {
        subMenuItems = productsMenuItems
      } else if (cell.entityType === 'version') {
        subMenuItems = [...versionsMenuItems, ...reviewsMenuItems]
      }

      // Apply filter if provided
      if (filter && typeof filter === 'function') {
        subMenuItems = subMenuItems.filter(filter)
      }

      // @ts-expect-error - product is not supported
      if (cell.entityType && listEntityTypes.includes(cell.entityType)) {
        // update to pass selected entities
        subMenuItems.push(newListMenuItem(cell.entityType as ListEntityType, selected))
      }

      const menuItems = buildAddToListMenu(subMenuItems)

      return menuItems
    },
    [folders.data, tasks.data, products.data, versions.data, buildListMenuItem, newListMenuItem],
  )

  const value = useMemo(
    () => ({
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
    }),
    [
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

export default EntityListsContext
