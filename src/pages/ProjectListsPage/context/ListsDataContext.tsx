import { createContext, useContext, ReactNode, useMemo } from 'react'
import { EntityList, EntityListFolderModel, useGetEntityListFoldersQuery } from '@shared/api'
import { useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { useQueryArgumentChangeLoading, useLocalStorage } from '@shared/hooks'
import useGetListsData from '../hooks/useGetListsData'
import { buildListsTableData } from '../util'
import { usePowerpack } from '@shared/context'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import { useListsViewSettings } from '@shared/containers'

export type ListsMap = Map<string, EntityList>

interface ListsDataContextValue {
  listsData: EntityList[]
  listsTableData: SimpleTableRow[]
  listsMap: ListsMap
  listFolders: EntityListFolderModel[]
  fetchNextPage: () => void
  isLoadingAll: boolean
  isLoadingMore: boolean
  isError?: boolean
  // filters
  listsFilters: QueryFilter
  setListsFilters: (filters: QueryFilter) => void
  // show archived
  showArchived: boolean
  setShowArchived: (show: boolean) => void
}

const ListsDataContext = createContext<ListsDataContextValue | undefined>(undefined)

interface ListsDataProviderProps {
  children: ReactNode
  entityListTypes?: string[]
  isReview?: boolean
}

// fetch all lists and provide methods to update the lists
export const ListsDataProvider = ({
  children,
  entityListTypes,
  isReview,
}: ListsDataProviderProps) => {
  const { powerLicense, isLoading: isLoadingLicense } = usePowerpack()
  const { projectName, isLoading: isFetchingProject } = useProjectDataContext()

  const isLoadingProject = useQueryArgumentChangeLoading({ projectName }, isFetchingProject)

  const { data: listFoldersAll = [], isLoading: isLoadingFolders } = useGetEntityListFoldersQuery(
    { projectName },
    { skip: !projectName },
  )

  // filter out folders by scope (right now we only have 'generic' and 'review-session')
  // we only show 'generic' folders in non-review mode, and 'review-session' in review mode
  const listFolders = useMemo(
    () =>
      listFoldersAll.filter((f) => {
        const scope = f.data?.scope
        if (!scope || scope.length === 0) return true // no scope means available for all
        const hasReviewScope = scope.includes('review-session')
        return isReview ? hasReviewScope : !hasReviewScope
      }),
    [isReview, listFoldersAll],
  )

  // Get filters from view settings (stored on view, not user config)
  const { filters: listsFilters = {}, onUpdateFilters: setListsFilters } = isReview
    ? { filters: {}, onUpdateFilters: () => {} }
    : useListsViewSettings()

  const [showArchived, setShowArchived] = useLocalStorage<boolean>('lists-show-archived', false)

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
  const listsTableData = useMemo(
    () => buildListsTableData(listsData, listFolders, true, powerLicense, showArchived),
    [listsData, listFolders, powerLicense, showArchived],
  )

  return (
    <ListsDataContext.Provider
      value={{
        listsData,
        listsTableData,
        listsMap,
        listFolders,
        isLoadingAll: isLoadingLists || isLoadingProject || isLoadingFolders || isLoadingLicense,
        isLoadingMore: isFetchingNextPage,
        isError,
        fetchNextPage,
        // filters
        listsFilters,
        setListsFilters,
        // show archived
        showArchived,
        setShowArchived,
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
