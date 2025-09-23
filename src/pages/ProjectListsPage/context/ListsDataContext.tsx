import { createContext, useContext, ReactNode, useMemo } from 'react'
import { AttributeEnumItem, AttributeModel, EntityList, useGetSiteInfoQuery } from '@shared/api'
import { useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { Filter } from '@ynput/ayon-react-components'
import { useQueryArgumentChangeLoading, useUserProjectConfig } from '@shared/hooks'
import useGetListsData from '../hooks/useGetListsData'
import { buildListsTableData } from '../util'

const LIST_SCOPE_ID = 'list'
export const LIST_CATEGORY_ATTRIBUTE = 'entityListCategory'

export type ListsMap = Map<string, EntityList>

interface ListsDataContextValue {
  listsData: EntityList[]
  listsTableData: SimpleTableRow[]
  listsMap: ListsMap
  attributes: AttributeModel[]
  categoryAttribute?: AttributeModel
  categories: AttributeEnumItem[] // specifically find categories
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
  isReview?: boolean
}

// fetch all lists and provide methods to update the lists
export const ListsDataProvider = ({
  children,
  entityListTypes,
  isReview,
}: ListsDataProviderProps) => {
  const { projectName, isLoading: isFetchingProject } = useProjectDataContext()

  const isLoadingProject = useQueryArgumentChangeLoading({ projectName }, isFetchingProject)

  const { data: info } = useGetSiteInfoQuery({ full: true })
  const { attributes = [] } = info || {}
  const listAttributes = useMemo(
    () => attributes.filter((attrib) => attrib.scope?.includes(LIST_SCOPE_ID)),
    [attributes],
  )

  const categoryAttribute = listAttributes.find((attrib) => attrib.name === LIST_CATEGORY_ATTRIBUTE)

  const categories = useMemo(() => {
    if (categoryAttribute && categoryAttribute.data.enum?.length) {
      return categoryAttribute.data.enum
    }
    return []
  }, [listAttributes])

  const [pageConfig, updatePageConfig, { isSuccess: columnsConfigReady }] = useUserProjectConfig({
    selectors: ['lists', projectName],
    init: {
      columnOrder: [],
      columnPinning: {},
      columnVisibility: {},
    },
  })

  const listsFilters = isReview ? [] : pageConfig?.listsFilters || ([] as Filter[])
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
  const listsTableData = useMemo(
    () => buildListsTableData(listsData, categories),
    [listsData, categories],
  )

  console.log({
    isLoadingLists,
    columnsConfigReady,
    isLoadingProject,
  })

  return (
    <ListsDataContext.Provider
      value={{
        listsData,
        listsTableData,
        listsMap,
        attributes: listAttributes,
        categoryAttribute,
        categories,
        isLoadingAll: isLoadingLists || !columnsConfigReady || isLoadingProject,
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
