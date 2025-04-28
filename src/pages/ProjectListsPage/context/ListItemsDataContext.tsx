import { createContext, useContext, ReactNode, useMemo } from 'react'
import { EntityListItem } from '@queries/lists/getLists'
import {
  ProjectDataContextProps,
  useProjectDataContext,
} from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import { SimpleTableRow } from '@shared/SimpleTable'
import { Filter } from '@ynput/ayon-react-components'
import { useUsersPageConfig } from '@pages/ProjectOverviewPage/hooks/useUserPageConfig'
import useGetListItemsData from '../hooks/useGetListItemsData'
import { useListsContext } from './ListsContext'
import { FolderNodeMap, TaskNodeMap } from '@shared/containers/ProjectTreeTable'

export type ListItemsMap = Map<string, EntityListItem>

interface ListItemsDataContextValue {
  // Project Info
  projectInfo?: ProjectDataContextProps['projectInfo']
  projectName: string
  users: ProjectDataContextProps['users']
  // Attributes
  attribFields: ProjectDataContextProps['attribFields']

  // LIST ITEMS DATA
  listItemsData: EntityListItem[]
  listItemsTableData: SimpleTableRow[]
  listItemsMap: ListItemsMap
  fetchNextPage: () => void
  isLoadingAll: boolean
  isLoadingMore: boolean
  isError?: boolean
  // filters
  listItemsFilters: Filter[]
  setListItemsFilters: (filters: Filter[]) => Promise<void>
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
    columnSorting,
    setColumnSorting,
  } = useProjectDataContext()

  const { rowSelection } = useListsContext()
  const selectedListsIds = Object.entries(rowSelection)
    .filter(([_, isSelected]) => isSelected)
    .map(([id]) => id)
  const selectedListId = selectedListsIds.length === 1 ? selectedListsIds[0] : undefined

  const [pageConfig, updatePageConfig, { isSuccess: columnsConfigReady }] = useUsersPageConfig({
    page: 'lists',
    projectName: projectName,
  })

  const listItemsFilters = pageConfig?.listItemsFilters || ([] as Filter[])
  const setListItemsFilters = async (filters: Filter[]) => {
    await updatePageConfig({ items: { filters } })
  }

  const {
    data: listItemsData,
    isLoading,
    isFetchingNextPage,
    isError,
    fetchNextPage,
  } = useGetListItemsData({
    projectName,
    listId: selectedListId,
    sortBy: undefined,
    filters: listItemsFilters,
  })

  // convert to a Map for easier access
  const listItemsMap: ListItemsMap = useMemo(() => {
    return new Map(listItemsData.map((item) => [item.id, item]))
  }, [listItemsData])

  // convert listItemsData into tableData
  const listItemsTableData = useMemo(() => {
    const tableRows: SimpleTableRow[] = listItemsData.map((list) => ({
      id: list.id,
      name: list.name,
      label: list.name,
      subRows: [],
      data: {
        id: list.id,
        // count: list.count,
        // owner: list.owner,
      },
    }))

    return tableRows
  }, [listItemsData])

  const foldersMap = new Map<string, FolderNodeMap>()
  const tasksMap = new Map<string, TaskNodeMap>()
  const itemsMap = new Map<string, any>()

  return (
    <ListItemsDataContext.Provider
      value={{
        projectName,
        projectInfo,
        attribFields,
        users,
        // list items
        listItemsData,
        listItemsTableData,
        listItemsMap,
        isLoadingAll: isLoading || !columnsConfigReady,
        isLoadingMore: isFetchingNextPage,
        isError,
        fetchNextPage,
        // filters
        listItemsFilters,
        setListItemsFilters,
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
