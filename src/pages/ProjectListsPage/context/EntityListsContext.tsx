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
  EntityListFolderModel,
  useGetEntityListFoldersQuery,
} from '@shared/api'
import { upperFirst } from 'lodash'
import { useSearchParams } from 'react-router-dom'
import { usePowerpack } from '@shared/context'

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
  command?: () => void
  items?: ListSubMenuItem[]
  disabled?: boolean
  hidden?: boolean
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
  // Build hierarchical menu items for arbitrary list collections (folders grouping)
  buildHierarchicalMenuItems: (
    lists: EntityList[],
    selected: { entityId: string; entityType: string | undefined }[],
    getShowIcon?: (list: EntityList) => boolean,
  ) => ListSubMenuItem[]
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
  const { powerLicense } = usePowerpack()
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

  // fetch list folders to build hierarchy (only needed when power license)
  const { data: listFoldersAll = [] } = useGetEntityListFoldersQuery(
    { projectName },
    { skip: !projectName || !powerLicense },
  )

  // no filtering by scope here (UI using this context is overview page)
  const listFolders = listFoldersAll as EntityListFolderModel[]

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

  // Build a hierarchical structure of folders -> lists (lists only actionable)
  const buildHierarchicalMenuItems = useCallback(
    (
      lists: EntityList[],
      selected: { entityId: string; entityType: string | undefined }[],
      getShowIcon?: (list: EntityList) => boolean,
    ): ListSubMenuItem[] => {
      // Simple cache keyed by folder+list ids + selection length + powerLicense flag
      // This prevents rebuilding identical structures across repeated context menu openings.
      // (Selection identities beyond length don't affect structure of destination list tree).
      type CacheValue = {
        items: ListSubMenuItem[]
        selectedRef: { entityId: string; entityType: string | undefined }[]
      }
      const staticCache = (buildHierarchicalMenuItems as any)._cache as
        | Map<string, CacheValue>
        | undefined
      const cache: Map<string, CacheValue> = staticCache || new Map()
      if (!(buildHierarchicalMenuItems as any)._cache) {
        ;(buildHierarchicalMenuItems as any)._cache = cache
      }

      const folderSig = powerLicense
        ? listFolders.map((f) => `${f.id}:${f.parentId || ''}:${f.label}`).join('|')
        : 'nofolders'
      const listSig = lists.map((l) => `${l.id}:${l.entityListFolderId || ''}`).join('|')
      const key = `${folderSig}::${listSig}::${selected.length}::${powerLicense}`

      const cached = cache.get(key)
      if (cached) {
        // Recreate command closures with current selection (list items carry command depending on selected)
        return cached.items.map((item) => ({
          ...item,
          // For nested items we keep structure; leaf list items already have bound commands referencing addToList with id
          items: item.items,
        }))
      }

      const resolveShowIcon = getShowIcon || (() => false)
      if (!powerLicense || !listFolders.length) {
        return lists.map((l) => buildListMenuItem(l, selected, resolveShowIcon(l)))
      }

      // folder node structure
      interface FolderNode {
        folder: EntityListFolderModel
        children: FolderNode[]
        lists: EntityList[]
      }
      const nodeMap = new Map<string, FolderNode>()

      // init nodes
      listFolders.forEach((f) => {
        nodeMap.set(f.id, { folder: f, children: [], lists: [] })
      })

      // link children
      listFolders.forEach((f) => {
        if (f.parentId && nodeMap.has(f.parentId)) {
          nodeMap.get(f.parentId)!.children.push(nodeMap.get(f.id)!)
        }
      })

      // assign lists
      lists.forEach((list) => {
        if (list.entityListFolderId && nodeMap.has(list.entityListFolderId)) {
          nodeMap.get(list.entityListFolderId)!.lists.push(list)
        }
      })

      // determine which folders (and ancestors) actually contain lists
      const folderHasListCache = new Map<string, boolean>()
      const hasAnyLists = (folderId: string): boolean => {
        if (folderHasListCache.has(folderId)) return folderHasListCache.get(folderId)!
        const node = nodeMap.get(folderId)
        if (!node) return false
        const value =
          node.lists.length > 0 || node.children.some((child) => hasAnyLists(child.folder.id))
        folderHasListCache.set(folderId, value)
        return value
      }

      const buildFolderItems = (nodes: FolderNode[]): ListSubMenuItem[] => {
        return nodes
          .filter((n) => hasAnyLists(n.folder.id))
          .map((n) => {
            const childFolders = buildFolderItems(n.children)
            const listItems = n.lists.map((l) => buildListMenuItem(l, selected, resolveShowIcon(l)))
            return {
              id: `folder-${n.folder.id}`,
              label: n.folder.label,
              icon: n.folder.data?.icon || 'snippet_folder',
              // Folders themselves are not actionable, only their items
              items: [...childFolders, ...listItems],
            }
          })
      }

      // root folders (no parentId)
      const rootNodes = listFolders
        .filter((f) => !f.parentId)
        .map((f) => nodeMap.get(f.id)!)
        .filter(Boolean)

      const folderItems = buildFolderItems(rootNodes)

      // lists without a folder (root lists)
      const rootLists = lists.filter((l) => !l.entityListFolderId)
      const rootListItems = rootLists.map((l) => buildListMenuItem(l, selected, resolveShowIcon(l)))

      const result = [...folderItems, ...rootListItems]
      cache.set(key, { items: result, selectedRef: selected })
      return result
    },
    [buildListMenuItem, listFolders, powerLicense],
  )

  const menuItems: EntityListsContextType['menuItems'] = useCallback(
    (filter) => (_e, cell, selected, _meta) => {
      const isMultipleEntityTypes = selected.some(
        (item) => item.entityType !== selected[0].entityType,
      )

      if (cell.isGroup) return []

      // helpers to decide icon visibility
      const getShowIconMultiple = () => isMultipleEntityTypes
      const getShowIconVersion = (list: EntityList) =>
        list.entityListType === 'review-session' ? true : !!reviews.data.length

      let subMenuItems: ListSubMenuItem[] = []

      if (isMultipleEntityTypes) {
        const combined = [...folders.data, ...tasks.data]
        subMenuItems = buildHierarchicalMenuItems(combined, selected, () => getShowIconMultiple())
      } else if (cell.entityType === 'folder') {
        subMenuItems = buildHierarchicalMenuItems(folders.data, selected, () =>
          getShowIconMultiple(),
        )
      } else if (cell.entityType === 'task') {
        subMenuItems = buildHierarchicalMenuItems(tasks.data, selected, () => getShowIconMultiple())
      } else if (cell.entityType === 'product') {
        subMenuItems = buildHierarchicalMenuItems(products.data, selected, () =>
          getShowIconMultiple(),
        )
      } else if (cell.entityType === 'version') {
        const combined = [...versions.data, ...reviews.data]
        subMenuItems = buildHierarchicalMenuItems(combined, selected, (l) => getShowIconVersion(l))
      }

      // Apply filter if provided
      if (filter && typeof filter === 'function') {
        subMenuItems = subMenuItems.filter(filter)
      }

      // Add new list item at end
      // @ts-expect-error - product is not supported in typings
      if (cell.entityType && listEntityTypes.includes(cell.entityType)) {
        subMenuItems.push(newListMenuItem(cell.entityType as ListEntityType, selected))
      }

      return buildAddToListMenu(subMenuItems)
    },
    [
      folders.data,
      tasks.data,
      products.data,
      versions.data,
      reviews.data,
      buildHierarchicalMenuItems,
      newListMenuItem,
      buildAddToListMenu,
    ],
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
      buildHierarchicalMenuItems,
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
      buildHierarchicalMenuItems,
    ],
  )

  return <EntityListsContext.Provider value={value}>{children}</EntityListsContext.Provider>
}

const useEntityListsContextInternal = () => useContext(EntityListsContext)

export const useEntityListsContext = () => {
  const context = useEntityListsContextInternal()
  if (context === undefined) {
    throw new Error('useEntityListsContext must be used within an EntityListsProvider')
  }
  return context
}

export const useOptionalEntityListsContext = () => useEntityListsContextInternal()

export default EntityListsContext
