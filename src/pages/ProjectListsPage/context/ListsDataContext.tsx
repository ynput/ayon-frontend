import { createContext, useContext, ReactNode, useMemo } from 'react'
import { EntityList, EntityListFolderModel, useGetEntityListFoldersQuery } from '@shared/api'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { Filter } from '@ynput/ayon-react-components'
import { useQueryArgumentChangeLoading, useUserProjectConfig, useLocalStorage } from '@shared/hooks'
import useGetListsData from '../hooks/useGetListsData'
import { buildListsTableData } from '../util'
import { usePowerpack, useProjectContext } from '@shared/context'

export type ListsMap = Map<string, EntityList>

interface ListsDataContextValue {
  listsData: EntityList[]
  listsTableData: SimpleTableRow[]
  listsMap: ListsMap
  disabledListIds: Set<string>
  listFolders: EntityListFolderModel[]
  fetchNextPage: () => void
  isLoadingAll: boolean
  isLoadingMore: boolean
  isError?: boolean
  // filters
  listsFilters: Filter[]
  setListsFilters: (filters: Filter[]) => Promise<void>
  // show archived
  showArchived: boolean
  setShowArchived: (show: boolean) => void
  refetch: () => void
}

const ListsDataContext = createContext<ListsDataContextValue | undefined>(undefined)

interface ListsDataProviderProps {
  children: ReactNode
  entityListTypes?: string[]
  isReview?: boolean
  isStoryboards?: boolean
  // picker mode: ignore the page's saved list filters (selection dialog, not the Lists page)
  picker?: boolean
  listsFilter?: (list: EntityList) => boolean
  listDisabled?: (list: EntityList) => string | undefined
}

// fetch all lists and provide methods to update the lists
export const ListsDataProvider = ({
  children,
  entityListTypes,
  isReview,
  isStoryboards,
  picker,
  listsFilter,
  listDisabled,
}: ListsDataProviderProps) => {
  const { powerLicense, isLoading: isLoadingLicense } = usePowerpack()
  const { projectName, isLoading: isFetchingProject } = useProjectContext()

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
        const hasStoryboardScope = scope.includes('storyboard');

        return isReview
          ? isStoryboards ? hasStoryboardScope : hasReviewScope
          : !hasReviewScope
      }),
    [isReview, isStoryboards, listFoldersAll],
  )

  const [pageConfig, updatePageConfig, { isSuccess: columnsConfigReady }] = useUserProjectConfig({
    selectors: ['lists', projectName],
    init: {
      columnOrder: [],
      columnPinning: {},
      columnVisibility: {},
    },
  })

  const listsFilters = isReview || picker ? [] : pageConfig?.listsFilters || ([] as Filter[])
  const setListsFilters = async (filters: Filter[]) => {
    await updatePageConfig({ listsFilters: filters })
  }

  const [showArchived, setShowArchived] = useLocalStorage<boolean>('lists-show-archived', false)

  const {
    data: listsDataRaw,
    isLoading: isLoadingLists,
    isFetchingNextPage,
    isError,
    fetchNextPage,
    refetch,
  } = useGetListsData({
    projectName,
    filters: listsFilters,
    entityListTypes,
  })

  const listsData = useMemo(
    () => (listsFilter ? listsDataRaw.filter(listsFilter) : listsDataRaw),
    [listsDataRaw, listsFilter],
  )

  // convert to a Map for easier access
  const listsMap: ListsMap = useMemo(() => {
    return new Map(listsData.map((list) => [list.id, list]))
  }, [listsData])

  const disabledListIds = useMemo(() => {
    const ids = new Set<string>()
    if (listDisabled) {
      for (const list of listsData) if (listDisabled(list)) ids.add(list.id)
    }
    return ids
  }, [listsData, listDisabled])

  // convert listsData into tableData
  const listsTableData = useMemo(
    () => buildListsTableData(listsData, listFolders, true, powerLicense, showArchived, listDisabled),
    [listsData, listFolders, powerLicense, showArchived, listDisabled],
  )

  return (
    <ListsDataContext.Provider
      value={{
        listsData,
        listsTableData,
        listsMap,
        disabledListIds,
        listFolders,
        isLoadingAll:
          isLoadingLists ||
          !columnsConfigReady ||
          isLoadingProject ||
          isLoadingFolders ||
          isLoadingLicense,
        isLoadingMore: isFetchingNextPage,
        isError,
        fetchNextPage,
        // filters
        listsFilters,
        setListsFilters,
        // show archived
        showArchived,
        setShowArchived,
        refetch,
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
