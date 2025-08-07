import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react'
import { EntityListItem } from '@shared/api'
import { ProjectDataContextProps, useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import useGetListItemsData from '../hooks/useGetListItemsData'
import { useListsContext } from './ListsContext'
import { FolderNodeMap, TableRow, TaskNodeMap } from '@shared/containers/ProjectTreeTable'
import useDeleteListItems, { UseDeleteListItemsReturn } from '../hooks/useDeleteListItems'
import { ContextMenuItemConstructors } from '@shared/containers/ProjectTreeTable/hooks/useCellContextMenu'
import { useEntityListsContext } from './EntityListsContext'
import useReorderListItem, { UseReorderListItemReturn } from '../hooks/useReorderListItem'
import useBuildListItemsTableData from '../hooks/useBuildListItemsTableData'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import { ListsViewSettings, useListsViewSettings } from '@shared/containers'
import { SortingState } from '@tanstack/react-table'

export type ListItemsMap = Map<string, EntityListItem>

export interface ListItemsDataContextValue {
  // Project Info
  projectInfo?: ProjectDataContextProps['projectInfo']
  projectName: string
  users: ProjectDataContextProps['users']
  selectedListId?: string
  // Attributes
  attribFields: ProjectDataContextProps['attribFields']

  // LIST ITEMS DATA
  listItemsData: EntityListItem[]
  listItemsTableData: TableRow[]
  listItemsMap: ListItemsMap
  fetchNextPage: () => void
  isLoadingAll: boolean
  isLoadingMore: boolean
  isError?: boolean
  isInitialized: boolean
  // filters
  listItemsFilters: QueryFilter
  setListItemsFilters: (filters: QueryFilter) => void
  // folders data
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  // columns config
  columns: ListsViewSettings['columns']
  onUpdateColumns: ListsViewSettings['onUpdateColumns']
  // context menu items
  // actions
  contextMenuItems: ContextMenuItemConstructors
  // delete (remove) from list
  deleteListItems: UseDeleteListItemsReturn['deleteListItems']
  deleteListItemAction: UseDeleteListItemsReturn['deleteListItemAction']
  // reorder list item
  reorderListItem: UseReorderListItemReturn['reorderListItem']
  // reset filters
  resetFilters: () => void
}

const ListItemsDataContext = createContext<ListItemsDataContextValue | undefined>(undefined)

interface ListItemsDataProviderProps {
  children: ReactNode
}

// fetch all items and provide methods to update the items
export const ListItemsDataProvider = ({ children }: ListItemsDataProviderProps) => {
  // Get project data from the new context
  const {
    projectName,
    projectInfo,
    attribFields,
    users,
    isInitialized,
    isLoading: isLoadingData,
  } = useProjectDataContext()

  const { selectedList } = useListsContext()
  const selectedListId = selectedList?.id

  // TODO: finish setting up settings for lists
  const {
    filters: listItemsFilters,
    onUpdateFilters: setListItemsFilters,
    columns,
    onUpdateColumns,
  } = useListsViewSettings()

  const updateSorting = (sorting: SortingState) => {
    onUpdateColumns({
      ...columns,
      sorting,
    })
  }

  const resetFilters = useCallback(() => {
    setListItemsFilters({ conditions: [], operator: 'and' })
  }, [setListItemsFilters])

  const {
    data: listItemsData,
    isLoading,
    isFetchingNextPage,
    isError,
    fetchNextPage,
  } = useGetListItemsData({
    projectName,
    entityType: selectedList?.entityType,
    listId: selectedListId,
    sorting: columns.sorting || [],
    filters: listItemsFilters,
  })

  // convert to a Map for easier access
  const listItemsMap: ListItemsMap = useMemo(() => {
    return new Map(listItemsData.map((item) => [item.id, item]))
  }, [listItemsData])

  // filter out attribFields by scope
  const scopedAttribFields = useMemo(
    () =>
      attribFields.filter((field) =>
        [selectedList?.entityType].some((s: any) => field.scope?.includes(s)),
      ),
    [attribFields, selectedList?.entityType],
  )

  // convert listItemsData into tableData
  const listItemsTableData = useBuildListItemsTableData({
    listItemsData,
  })

  const foldersMap: FolderNodeMap = new Map(
    // @ts-ignore
    listItemsData.filter((item) => item.entityType === 'folder'),
  )
  const tasksMap: TaskNodeMap = new Map()

  // delete lists
  const { deleteListItems, deleteListItemMenuItem, deleteListItemAction } = useDeleteListItems({
    projectName: projectName,
    listId: selectedListId,
    listItemsMap,
  })

  const handleReorderFinished = () => {
    // remove any sorting
    updateSorting([])
  }

  // reorder lists item
  const { reorderListItem } = useReorderListItem({
    projectName: projectName,
    listId: selectedListId,
    listItems: listItemsData,
    onReorderFinished: handleReorderFinished,
  })

  // lists data
  const { menuItems: menuItemsAddToList } = useEntityListsContext()

  // inject in custom add to list context menu items
  const contextMenuItems: ContextMenuItemConstructors = [
    'copy-paste',
    'show-details',
    'open-viewer',
    deleteListItemMenuItem,
    // add context menu to add to lists but filter out own list
    menuItemsAddToList((item) => item.id !== selectedListId),
  ]

  return (
    <ListItemsDataContext.Provider
      value={{
        projectName,
        projectInfo,
        selectedListId,
        attribFields: scopedAttribFields,
        users,
        // list items
        listItemsData,
        listItemsTableData,
        listItemsMap,
        isLoadingAll: isLoading || isLoadingData,
        isLoadingMore: isFetchingNextPage,
        isError,
        fetchNextPage,
        // filters
        listItemsFilters,
        setListItemsFilters,
        // folders data
        foldersMap,
        tasksMap,
        isInitialized,
        // columns config
        columns,
        onUpdateColumns,
        // actions
        contextMenuItems,
        // delete (remove) from list
        deleteListItems,
        deleteListItemAction,
        // reorder list item
        reorderListItem,
        resetFilters,
      }}
    >
      {children}
    </ListItemsDataContext.Provider>
  )
}

export const useListItemsDataContext = () => {
  const context = useContext(ListItemsDataContext)
  if (context === undefined) {
    throw new Error('useListItemsDataContext must be used within a ListItemsDataProvider')
  }
  return context
}

export default ListItemsDataContext
