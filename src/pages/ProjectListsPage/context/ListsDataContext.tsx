import { createContext, useContext, ReactNode, useMemo, useState } from 'react'
import { EntityListItem, useGetListsInfiniteInfiniteQuery } from '@queries/lists/getLists'
import { useProjectDataContext } from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import { SimpleTableRow } from '@shared/SimpleTable'
import { getEntityTypeIcon } from '@shared/util'
import { Filter } from '@ynput/ayon-react-components'
import { clientFilterToQueryFilter } from '@shared/containers/ProjectTreeTable'
import { useUsersPageConfig } from '@pages/ProjectOverviewPage/hooks/useUserPageConfig'

export type ListsMap = Map<string, EntityListItem>

interface ListsDataContextValue {
  listsData: EntityListItem[]
  listsTableData: SimpleTableRow[]
  listsMap: ListsMap
  handleFetchNextPage: () => void
  isLoadingAll: boolean
  isLoadingMore: boolean
  isError?: boolean
  // filters
  listsFilters: Filter[]
  setListsFilters: (filters: Filter[]) => Promise<void>
}

const ListsDataContext = createContext<ListsDataContextValue | undefined>(undefined)

interface ListsDataProviderProps {
  children: ReactNode
}

// fetch all lists and provide methods to update the lists
export const ListsDataProvider = ({ children }: ListsDataProviderProps) => {
  const { projectName } = useProjectDataContext()

  const [pageConfig, updatePageConfig, { isSuccess: columnsConfigReady }] = useUsersPageConfig({
    page: 'overview',
    projectName: projectName,
  })

  const listsFilters = pageConfig?.listsFilters || ([] as Filter[])
  const setListsFilters = async (filters: Filter[]) => {
    await updatePageConfig({ listsFilters: filters })
  }

  const [previousProjectName, setPreviousProjectName] = useState(projectName)

  const queryFilter = clientFilterToQueryFilter(listsFilters)
  const queryFilterString = listsFilters.length ? JSON.stringify(queryFilter) : ''

  const {
    data: listsInfiniteData,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
  } = useGetListsInfiniteInfiniteQuery(
    {
      projectName,
      filter: queryFilterString,
    },
    {
      initialPageParam: { cursor: '' },
    },
  )

  // Detect when projectName changes to track fetching due to project change
  const isFetchingNewProject = useMemo(() => {
    const isProjectChanged = previousProjectName !== projectName
    if (isProjectChanged && !isFetching) {
      setPreviousProjectName(projectName)
    }
    return isFetching && isProjectChanged
  }, [isFetching, isFetching, previousProjectName, projectName])

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

  // convert to a Map for easier access
  const listsMap: ListsMap = useMemo(() => {
    return new Map(listsData.map((list) => [list.id, list]))
  }, [listsData])

  // convert listsData into tableData
  const listsTableData = useMemo(() => {
    const tableRows: SimpleTableRow[] = listsData.map((list) => ({
      id: list.id,
      name: list.label,
      label: list.label,
      icon: getEntityTypeIcon(list.entityType),
      subRows: [],
      data: {
        id: list.id,
        count: list.count,
        owner: list.owner,
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
        listsMap,
        isLoadingAll: isLoading || isFetchingNewProject || !columnsConfigReady,
        isLoadingMore: isFetchingNextPage,
        isError,
        // filters
        listsFilters,
        setListsFilters,
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
