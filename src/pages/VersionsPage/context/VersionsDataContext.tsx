import { useGetVersionsByProductsQuery, useGetVersionsInfiniteQuery } from '@shared/api'
import { useGetProductsInfiniteQuery } from '@shared/api/queries'
import {
  flattenInfiniteVersionsData,
  flattenInfiniteProductsData,
} from '@shared/api/queries/versions/versionsUtils'
import { createContext, FC, ReactNode, useContext, useMemo, useState } from 'react'
import { buildVersionsAndProductsMaps, VersionNodeExtended, ProductNodeExtended } from '../util'
import { useBuildVersionsTableData } from '../hooks'
import {
  createFilterFromSlicer,
  TableRow,
  useExpandedState,
  useProjectDataContext,
  useQueryFilters,
  useSelectedFolders,
  useVersionsViewSettings,
} from '@shared/containers'
import { ExpandedState, OnChangeFn } from '@tanstack/react-table'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import { splitFiltersByScope } from '@shared/components/SearchFilter/useBuildFilterOptions'
import { useSlicerContext } from '@context/SlicerContext'

export type VersionMap = Map<string, VersionNodeExtended>
export type ProductMap = Map<string, ProductNodeExtended>

interface VersionsDataContextValue {
  // STACKED
  showProducts: boolean
  onUpdatedShowProducts: (stacked: boolean) => void
  //   EXPANDED
  expanded: ExpandedState
  setExpanded: (expanded: ExpandedState) => void
  updateExpanded: OnChangeFn<ExpandedState>
  //   ALL FILTERS (versions + products)
  filters: QueryFilter
  onUpdateFilters: (filters: QueryFilter) => void
  // separate filters
  versionFilter: QueryFilter
  productFilter: QueryFilter
  // data
  versionsTableData: TableRow[]
  versionsMap: VersionMap // root versions only
  childVersionsMap: VersionMap // child versions only
  allVersionsMap: VersionMap // all versions combined
  productsMap: ProductMap // all products
  entitiesMap: Map<string, VersionNodeExtended | ProductNodeExtended> // all versions and products
  hasNextPage: boolean | undefined
  fetchNextPage: () => void
  isFetchingNextPage: boolean
  // meta
  error: string | undefined
}

const VersionsDataContext = createContext<VersionsDataContextValue | null>(null)

export const useVersionsDataContext = () => {
  const context = useContext(VersionsDataContext)
  if (!context) {
    throw new Error('useVersionsDataContext must be used within VersionsDataProvider')
  }
  return context
}

interface VersionsDataProviderProps {
  projectName: string
  children: ReactNode
}

export const VersionsDataProvider: FC<VersionsDataProviderProps> = ({ projectName, children }) => {
  const { attribFields } = useProjectDataContext()
  const { filters, onUpdateFilters, showStacked, onUpdateShowStacked, sortBy, sortDesc } =
    useVersionsViewSettings()

  const showProducts = showStacked
  const onUpdatedShowProducts = onUpdateShowStacked
  const [expanded, setExpanded] = useState<ExpandedState>({})

  // Separate the combined filters into version and product filters
  const {
    version: versionFilter = { conditions: [] },
    product: productFilter = { conditions: [] },
  } = useMemo(() => {
    return splitFiltersByScope(filters, ['version', 'product'])
  }, [filters])

  const { updateExpanded, expandedIds } = useExpandedState({
    expanded,
    setExpanded,
  })

  // SLICER
  const { rowSelection, sliceType, rowSelectionData, persistentRowSelectionData } =
    useSlicerContext()
  const sliceFilter = createFilterFromSlicer({
    type: sliceType,
    selection: rowSelectionData,
    attribFields: attribFields,
  })
  // get selected folders from slicer
  const slicerFolderIds = useSelectedFolders({
    rowSelection,
    sliceType,
    persistentRowSelectionData,
  })
  // combine slicer filters with version/product filters
  const combinedVersionFilter = useQueryFilters({
    queryFilters: versionFilter,
    sliceFilter,
  })
  const combinedProductFilter = useQueryFilters({
    queryFilters: productFilter,
    sliceFilter,
  })

  // Get all products when showing products
  const {
    data: productsData,
    hasNextPage: productsHasNextPage,
    fetchNextPage: productsFetchNextPage,
    isFetchingNextPage: productsIsFetchingNextPage,
    error: productsError,
  } = useGetProductsInfiniteQuery(
    {
      projectName,
      productFilter: combinedProductFilter.filterString,
      versionFilter: combinedVersionFilter.filterString,
      folderIds: slicerFolderIds,
      sortBy,
      desc: sortDesc,
    },
    {
      skip: !showProducts,
      initialPageParam: {
        cursor: '',
        desc: sortDesc,
      },
    },
  )

  // Get all versions when not showing products
  const {
    data: versionsData,
    hasNextPage: versionsHasNextPage,
    fetchNextPage: versionsFetchNextPage,
    isFetchingNextPage: versionsIsFetchingNextPage,
    error: versionsError,
  } = useGetVersionsInfiniteQuery(
    {
      projectName,
      versionFilter: combinedVersionFilter.filterString,
      productFilter: combinedProductFilter.filterString,
      folderIds: slicerFolderIds,
      sortBy,
      desc: sortDesc,
    },
    {
      skip: showProducts,
      initialPageParam: {
        cursor: '',
        desc: sortDesc,
      },
    },
  )

  // Dynamic pagination based on showProducts
  const hasNextPage = showProducts ? productsHasNextPage : versionsHasNextPage
  const fetchNextPage = showProducts ? productsFetchNextPage : versionsFetchNextPage
  const isFetchingNextPage = showProducts ? productsIsFetchingNextPage : versionsIsFetchingNextPage

  const versions = useMemo(() => flattenInfiniteVersionsData(versionsData), [versionsData])
  const products = useMemo(() => flattenInfiniteProductsData(productsData), [productsData])

  // EXPANDED CHILD VERSIONS QUERY
  // get child versions for expanded products
  const { data: { versions: childVersions = [] } = {} } = useGetVersionsByProductsQuery({
    projectName,
    productIds: expandedIds,
    versionFilter: combinedVersionFilter.filterString,
  })

  // Efficiently build all maps in a single pass using util
  const { versionsMap, childVersionsMap, allVersionsMap, productsMap, entitiesMap } = useMemo(
    () => buildVersionsAndProductsMaps(versions, childVersions, products),
    [versions, childVersions, products],
  )

  const versionsTableData = useBuildVersionsTableData({
    rootVersionsMap: versionsMap,
    childVersionsMap,
    productsMap,
    showProducts,
  })

  const error = showProducts
    ? // @ts-ignore
      productsError && String(productsError.error)
    : // @ts-ignore
      versionsError && String(versionsError.error)

  const value: VersionsDataContextValue = {
    showProducts,
    onUpdatedShowProducts,
    // filters
    filters,
    onUpdateFilters,
    versionFilter,
    productFilter,
    // expanded
    expanded,
    setExpanded,
    updateExpanded,
    // data
    versionsTableData,
    versionsMap,
    childVersionsMap,
    allVersionsMap,
    productsMap,
    entitiesMap,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    // meta
    error,
  }

  return <VersionsDataContext.Provider value={value}>{children}</VersionsDataContext.Provider>
}
