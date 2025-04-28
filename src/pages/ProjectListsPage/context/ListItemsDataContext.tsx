import { createContext, useContext, ReactNode, useMemo } from 'react'
import { EntityListItem } from '@queries/lists/getLists'
import { useProjectDataContext } from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import { SimpleTableRow } from '@shared/SimpleTable'
import { Filter } from '@ynput/ayon-react-components'
import { useUsersPageConfig } from '@pages/ProjectOverviewPage/hooks/useUserPageConfig'
import useGetListItemsData from '../hooks/useGetListItemsData'
import { useListsContext } from './ListsContext'

export type ListItemsMap = Map<string, EntityListItem>

interface ListItemsDataContextValue {
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
  const { projectName } = useProjectDataContext()
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

  return (
    <ListItemsDataContext.Provider
      value={{
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
