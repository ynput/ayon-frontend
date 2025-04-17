import { createContext, useContext, ReactNode, useMemo } from 'react'
import { EntityListItem, useGetListsInfiniteInfiniteQuery } from '@queries/lists/getLists'
import { useProjectDataContext } from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import { SimpleTableRow } from '@shared/SimpleTable'

interface ListsDataContextValue {
  listsData: EntityListItem[]
  listsTableData: SimpleTableRow[]
  handleFetchNextPage: () => void
  isLoadingAll: boolean
  isLoadingMore: boolean
}

const ListsDataContext = createContext<ListsDataContextValue | undefined>(undefined)

interface ListsDataProviderProps {
  children: ReactNode
}

// fetch all lists and provide methods to update the lists
export const ListsDataProvider = ({ children }: ListsDataProviderProps) => {
  const { projectName } = useProjectDataContext()

  const {
    data: listsInfiniteData,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useGetListsInfiniteInfiniteQuery(
    {
      projectName,
    },
    {
      initialPageParam: { cursor: '' },
    },
  )

  const handleFetchNextPage = () => {
    if (hasNextPage) {
      console.log('fetching next page')
      fetchNextPage()
    }
  }

  // Extract tasks from infinite query data correctly
  const listsData = useMemo(() => {
    if (!listsInfiniteData?.pages) return []
    return listsInfiniteData.pages.flatMap((page) => page.lists || [])
  }, [listsInfiniteData?.pages])

  // convert listsData into tableData
  const listsTableData = useMemo(() => {
    const tableRows: SimpleTableRow[] = listsData.map((list) => ({
      id: list.id,
      name: list.label,
      label: list.label,
      subRows: [],
      data: {
        id: list.id,
        count: list.items.length,
      },
    }))

    return tableRows
  }, [listsData])

  return (
    <ListsDataContext.Provider
      value={{
        listsData,
        handleFetchNextPage,
        listsTableData,
        isLoadingAll: isFetching,
        isLoadingMore: isFetchingNextPage,
      }}
    >
      {children}
    </ListsDataContext.Provider>
  )
}

export const useListsDataContext = () => {
  const context = useContext(ListsDataContext)
  if (context === undefined) {
    throw new Error('useListsDataContext must be used within a ListsDataProvider')
  }
  return context
}

export default ListsDataContext
