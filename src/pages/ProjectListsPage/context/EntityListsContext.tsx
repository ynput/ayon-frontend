import { createContext, useContext, ReactNode } from 'react'
import useGetListsData, { UseGetListsDataReturn } from '../hooks/useGetListsData'
import { ListEntityType, listEntityTypes } from '../components/NewListDialog/NewListDialog'
import { toast } from 'react-toastify'
import { getEntityTypeIcon } from '@shared/util'
import { EntityListItem } from '@queries/lists/getLists'
import { ContextMenuItemConstructor } from '@shared/containers/ProjectTreeTable/hooks/useCellContextMenu'
import { useCreateEntityListItemMutation } from '@queries/lists/updateLists'

interface EntityListsContextProps {
  entityTypes: ListEntityType[]
  projectName: string
}

type ListSubMenuItem = {
  id: string
  label: string
  icon?: string
  command: () => void
}

export interface EntityListsContextValue {
  folders: UseGetListsDataReturn
  tasks: UseGetListsDataReturn
  products: UseGetListsDataReturn
  versions: UseGetListsDataReturn
  addToList: (
    listId: string,
    entityType: string,
    entities: { entityId: string; entityType: string | undefined }[],
  ) => Promise<void>
  menuItems: ContextMenuItemConstructor
  buildListMenuItem: (
    list: EntityListItem,
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
}

const EntityListsContext = createContext<EntityListsContextValue | undefined>(undefined)

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
    skip: !entityTypes.includes('product'),
  })
  //VERSIONS
  const versions = useGetListsData({
    projectName,
    filters: getFilter('version'),
    skip: !entityTypes.includes('version'),
  })

  const [createEntityListItem] = useCreateEntityListItemMutation()

  const addToList: EntityListsContextValue['addToList'] = async (listId, entityType, entities) => {
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

    try {
      const results = await Promise.allSettled(
        filteredEntities.map((entity, index) =>
          createEntityListItem({
            listId,
            projectName,
            entityListItemPostModel: {
              entityId: entity.entityId,
              position: index,
            },
          }).unwrap(),
        ),
      )

      const errors = results.filter((result) => result.status === 'rejected')

      if (errors.length > 0) {
        if (errors.length === results.length) {
          const error = errors[0]
          if (error.status === 'rejected') {
            toast.error('Error adding to list: ' + error.reason.data.detail)
          }
          return Promise.reject(new Error('Error adding to list'))
        }
        toast.warn('Some items were not added to the list')
        const error = errors[0]
        if (error.status === 'rejected') {
          toast.error('Error adding to list: ' + error.reason.data.detail)
        }
      }

      toast.success(`Item${results.length > 1 ? 's' : ''} added to list`)

      return Promise.resolve()
    } catch (error) {
      toast.error('Error adding to list')
      return Promise.reject(error)
    }
  }

  const buildListMenuItem: EntityListsContextValue['buildListMenuItem'] = (
    list,
    selected,
    showIcon?,
  ) => ({
    id: list.id,
    label: list.label,
    icon: showIcon ? getEntityTypeIcon(list.entityType) : undefined,
    command: () =>
      addToList(
        list.id,
        list.entityType,
        selected.map((i) => ({ entityId: i.entityId, entityType: i.entityType })),
      ),
  })

  const buildAddToListMenu: EntityListsContextValue['buildAddToListMenu'] = (items, menu) => {
    return {
      id: 'add-to-list',
      label: menu?.label || 'Add to list',
      icon: 'list_alt_add',
      items: items,
    }
  }

  const menuItems: ContextMenuItemConstructor = (_e, cell, selected, _meta) => {
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
      buildListMenuItem(version, selected, isMultipleEntityTypes),
    )

    let subMenuItems: any[] = []
    if (isMultipleEntityTypes) {
      subMenuItems = [...foldersMenuItems, ...tasksMenuItems]
    } else if (cell.entityType === 'folder') {
      subMenuItems = foldersMenuItems
    } else if (cell.entityType === 'task') {
      subMenuItems = tasksMenuItems
    } else if (cell.entityType === 'product') {
      subMenuItems = productsMenuItems
    } else if (cell.entityType === 'version') {
      subMenuItems = versionsMenuItems
    }

    return buildAddToListMenu(subMenuItems)
  }

  return (
    <EntityListsContext.Provider
      value={{
        folders,
        tasks,
        products,
        versions,
        addToList,
        menuItems,
        buildListMenuItem,
        buildAddToListMenu,
      }}
    >
      {children}
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

export default EntityListsContext
