import { ReactNode, useMemo } from 'react'
import { EntityList, EntityListFolderModel, useGetEntityListFoldersQuery } from '@shared/api'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { Filter } from '@ynput/ayon-react-components'
import { useQueryArgumentChangeLoading, useUserProjectConfig, useLocalStorage } from '@shared/hooks'
import { DEFAULT_LISTS_SORT, ListsSort } from '@shared/util/sortLists'
import { useGetListsData } from '../hooks/useGetListsData'
import { buildListsTableData, isFolderInScope } from '../util'
import { usePowerpack, useProjectContext } from '@shared/context'
import { ListsDataContext } from './ListsDataContextInstance'

export type ListsMap = Map<string, EntityList>

export interface ListsDataContextValue {
  listsData: EntityList[]
  listsTableData: SimpleTableRow[]
  listsMap: ListsMap
  disabledListIds: Set<string>
  disabledFolderMessages: Map<string, string>
  listFolders: EntityListFolderModel[]
  fetchNextPage: () => void
  isLoadingAll: boolean
  isLoadingMore: boolean
  isError?: boolean
  // filters
  listsFilters: Filter[]
  setListsFilters: (filters: Filter[]) => Promise<void>
  // sorting
  listsSort: ListsSort
  setListsSort: (sort: ListsSort) => void
  // show archived
  showArchived: boolean
  setShowArchived: (show: boolean) => void
  refetch: () => void
}

interface ListsDataProviderProps {
  children: ReactNode
  listsSort?: ListsSort
  setListsSort?: (sort: ListsSort) => void
  // the list types shown, and the folders of those types (all types when not set)
  entityListTypes?: string[]
  // the review sessions page: no saved list filters
  isReview?: boolean
  // picker mode: ignore the page's saved list filters (selection dialog, not the Lists page)
  picker?: boolean
  // folder destination picker: only the folder tree, lists are never fetched or rendered
  foldersOnly?: boolean
  listsFilter?: (list: EntityList) => boolean
  listDisabled?: (list: EntityList) => string | undefined
  // why folders can't be picked, keyed by folder id; batched so ancestry checks run once per render
  getDisabledFolders?: (folders: EntityListFolderModel[]) => Map<string, string>
}

// fetch all lists and provide methods to update the lists
export const ListsDataProvider = ({
  children,
  listsSort = DEFAULT_LISTS_SORT,
  setListsSort = () => {},
  entityListTypes,
  isReview,
  picker,
  foldersOnly,
  listsFilter,
  listDisabled,
  getDisabledFolders,
}: ListsDataProviderProps) => {
  const {
    powerLicense: livePowerLicense,
    isLoading: isLoadingLicense,
    storedLicense,
  } = usePowerpack()
  // the license changes the table layout (folders), so use the last known license while the
  // check runs instead of waiting for it, unless there never was one
  const powerLicense = isLoadingLicense ? !!storedLicense : livePowerLicense
  const isWaitingForLicense = isLoadingLicense && storedLicense === null
  const { projectName, isLoading: isFetchingProject } = useProjectContext()

  const isLoadingProject = useQueryArgumentChangeLoading({ projectName }, isFetchingProject)

  const { data: listFoldersAll = [], isLoading: isLoadingFolders } = useGetEntityListFoldersQuery(
    { projectName },
    { skip: !projectName },
  )

  // only the folders of the list types shown ('generic', 'review-session' or both)
  const listTypesKey = entityListTypes?.join(',')
  const listFolders = useMemo(
    () => listFoldersAll.filter((f) => isFolderInScope(f, entityListTypes)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listTypesKey, listFoldersAll],
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
    skip: foldersOnly,
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

  const disabledFolderMessages = useMemo(
    () => getDisabledFolders?.(listFolders) ?? new Map<string, string>(),
    [listFolders, getDisabledFolders],
  )

  // convert listsData into tableData
  const listsTableData = useMemo(
    () =>
      buildListsTableData(
        listsData,
        listFolders,
        true,
        powerLicense,
        showArchived,
        listDisabled,
        getDisabledFolders ? (folder) => disabledFolderMessages.get(folder.id) : undefined,
        listsSort,
      ),
    [
      listsData,
      listFolders,
      powerLicense,
      showArchived,
      listDisabled,
      getDisabledFolders,
      disabledFolderMessages,
      listsSort,
    ],
  )

  return (
    <ListsDataContext.Provider
      value={{
        listsData,
        listsTableData,
        listsMap,
        disabledListIds,
        disabledFolderMessages,
        listFolders,
        isLoadingAll:
          isLoadingLists ||
          !columnsConfigReady ||
          isLoadingProject ||
          isLoadingFolders ||
          isWaitingForLicense,
        isLoadingMore: isFetchingNextPage,
        isError,
        fetchNextPage,
        // filters
        listsFilters,
        setListsFilters,
        // sorting
        listsSort,
        setListsSort,
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
