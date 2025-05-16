import { createContext, useContext, ReactNode, useMemo } from 'react'
import { EntityList } from '@shared/api'
import { useProjectDataContext } from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import { SimpleTableRow } from '@shared/SimpleTable'
import { Filter } from '@ynput/ayon-react-components'
import { useUsersPageConfig } from '@pages/ProjectOverviewPage/hooks/useUserPageConfig'
import useGetListsData from '../hooks/useGetListsData'
import { buildListsTableData } from '../util'

export type ListsMap = Map<string, EntityList>

interface ListsDataContextValue {
  listsData: EntityList[]
  listsTableData: SimpleTableRow[]
  listsMap: ListsMap
  fetchNextPage: () => void
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
  entityListTypes?: string[]
}

// fetch all lists and provide methods to update the lists
export const ListsDataProvider = ({ children, entityListTypes }: ListsDataProviderProps) => {
  const { projectName, isInitialized, isLoading: isLoadingProject } = useProjectDataContext()

  const [pageConfig, updatePageConfig, { isSuccess: columnsConfigReady }] = useUsersPageConfig({
    selectors: ['lists', projectName],
    init: {
      columnOrder: [],
      columnPinning: {},
      columnVisibility: {},
    },
  })

  const listsFilters = pageConfig?.listsFilters || ([] as Filter[])
  const setListsFilters = async (filters: Filter[]) => {
    await updatePageConfig({ listsFilters: filters })
  }

  const {
    data: listsData,
    isLoading: isLoadingLists,
    isFetchingNextPage,
    isError,
    fetchNextPage,
  } = useGetListsData({
    projectName,
    filters: listsFilters,
    entityListTypes,
  })

  // convert to a Map for easier access
  const listsMap: ListsMap = useMemo(() => {
    return new Map(listsData.map((list) => [list.id, list]))
  }, [listsData])

  // convert listsData into tableData
  const listsTableData = useMemo(() => buildListsTableData(listsData), [listsData])

  return (
    <ListsDataContext.Provider
      value={{
        listsData,
        listsTableData,
        listsMap,
        isLoadingAll: isLoadingLists || !columnsConfigReady || isLoadingProject || !isInitialized,
        isLoadingMore: isFetchingNextPage,
        isError,
        fetchNextPage,
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
