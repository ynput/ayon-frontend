import { useGetVersionsByProductsQuery, useGetVersionsInfiniteQuery } from '@shared/api'
import { useGetProductsInfiniteQuery } from '@shared/api/queries'
import {
  flattenInfiniteVersionsData,
  flattenInfiniteProductsData,
} from '@shared/api/queries/versions/versionsUtils'
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react'
import {
  buildVersionsAndProductsMaps,
  VersionNodeExtended,
  ProductNodeExtended,
  determineLoadingProductVersions,
} from '../util'
import { useBuildVersionsTableData } from '../hooks'
import {
  createFilterFromSlicer,
  TableRow,
  useExpandedState,
  useProjectDataContext,
  useQueryFilters,
  useSelectedFolders,
} from '@shared/containers'
import { ExpandedState, OnChangeFn } from '@tanstack/react-table'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import {
  splitClientFiltersByScope,
  splitFiltersByScope,
} from '@shared/components/SearchFilter/useBuildFilterOptions'
import { useSlicerContext } from '@context/SlicerContext'
import { useVersionsViewsContext } from './VersionsViewsContext'
import { useQueryArgumentChangeLoading } from '@shared/hooks'
import { toast } from 'react-toastify'

export type VersionMap = Map<string, VersionNodeExtended>
export type ProductMap = Map<string, ProductNodeExtended>

interface VersionsDataContextValue {
  //   EXPANDED
  expanded: ExpandedState
  setExpanded: (expanded: ExpandedState) => void
  updateExpanded: OnChangeFn<ExpandedState>
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
  // loading
  isLoading: boolean
  isFetchingNextPage: boolean
  loadingProductVersions: Record<string, number> // product IDs to their version counts that are loading
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
  const { filters, showProducts, sortBy, sortDesc } = useVersionsViewsContext()

  const [expanded, setExpanded] = useState<ExpandedState>({})

  // Separate the combined filters into version and product filters
  const {
    version: versionFilter = { conditions: [] },
    product: productFilter = { conditions: [] },
    task: taskFilter = { conditions: [] },
  } = useMemo(() => {
    return splitFiltersByScope(filters, ['version', 'product', 'task'])
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

  // Separate slicer filters into different types
  const {
    version: [slicerVersionFilter],
    product: [slicerProductFilter],
    task: [slicerTaskFilter],
  } = useMemo(() => {
    return splitClientFiltersByScope(
      sliceFilter ? [sliceFilter] : null,
      ['version', 'product', 'task'],
      {
        taskType: 'task',
      },
    )
  }, [sliceFilter])
  // get selected folders from slicer
  const slicerFolderIds = useSelectedFolders({
    rowSelection,
    sliceType,
    persistentRowSelectionData,
  })
  // combine slicer filters with version/product filters
  const combinedVersionFilter = useQueryFilters({
    queryFilters: versionFilter,
    sliceFilter: slicerVersionFilter,
  })
  const combinedProductFilter = useQueryFilters({
    queryFilters: productFilter,
    sliceFilter: slicerProductFilter,
  })
  const combinedTaskFilter = useQueryFilters({
    queryFilters: taskFilter,
    sliceFilter: slicerTaskFilter,
  })

  const queryArgs = {
    projectName,
    versionFilter: combinedVersionFilter.filterString,
    productFilter: combinedProductFilter.filterString,
    taskFilter: combinedTaskFilter.filterString,
    folderIds: slicerFolderIds,
    sortBy,
    desc: sortDesc,
  }

  // QUERY: Get all products when showing products
  const {
    data: productsData,
    hasNextPage: productsHasNextPage,
    fetchNextPage: productsFetchNextPage,
    isFetchingNextPage: productsIsFetchingNextPage,
    isFetching: isFetchingProducts,
    error: productsError,
  } = useGetProductsInfiniteQuery(queryArgs, {
    skip: !showProducts,
    initialPageParam: {
      cursor: '',
      desc: sortDesc,
    },
  })

  // QUERY: Get all versions when not showing products
  const {
    data: versionsData,
    hasNextPage: versionsHasNextPage,
    fetchNextPage: versionsFetchNextPage,
    isFetchingNextPage: versionsIsFetchingNextPage,
    isFetching: isFetchingVersions,
    error: versionsError,
  } = useGetVersionsInfiniteQuery(queryArgs, {
    skip: showProducts,
    initialPageParam: {
      cursor: '',
      desc: sortDesc,
    },
  })

  const isLoadingTable = useQueryArgumentChangeLoading(
    queryArgs,
    isFetchingProducts || isFetchingVersions,
  )

  // Dynamic pagination based on showProducts
  const hasNextPage = showProducts ? productsHasNextPage : versionsHasNextPage
  const fetchNextPage = showProducts ? productsFetchNextPage : versionsFetchNextPage
  const isFetchingNextPage = showProducts ? productsIsFetchingNextPage : versionsIsFetchingNextPage

  const versions = useMemo(() => flattenInfiniteVersionsData(versionsData), [versionsData])
  const products = useMemo(() => flattenInfiniteProductsData(productsData), [productsData])

  // QUERY: get child versions for expanded products
  const {
    data: { versions: childVersions = [], errors: childVersionsErrors } = {},
    error: childVersionsError,
  } = useGetVersionsByProductsQuery({
    projectName,
    productIds: expandedIds,
    versionFilter: combinedVersionFilter.filterString,
    sortBy,
    desc: sortDesc,
  })

  // Efficiently build all maps in a single pass using util
  const { versionsMap, childVersionsMap, allVersionsMap, productsMap, entitiesMap } = useMemo(
    () => buildVersionsAndProductsMaps(versions, childVersions, products),
    [versions, childVersions, products],
  )

  // Determine which products are currently loading versions
  const loadingProductVersions = useMemo(() => {
    return determineLoadingProductVersions({
      childVersions,
      expandedProductIds: expandedIds,
      productsMap,
      hasFiltersApplied: (filters.conditions?.length || 0) > 0,
    })
  }, [childVersions, expandedIds, productsMap])

  const versionsTableData = useBuildVersionsTableData({
    rootVersionsMap: versionsMap,
    childVersionsMap,
    productsMap,
    showProducts,
    isFetchingNextPage,
    hasNextPage,
    loadingProductVersions,
    childVersionsErrors,
  })

  const error = showProducts
    ? // @ts-ignore
      productsError && String(productsError.error)
    : // @ts-ignore
      versionsError && String(versionsError.error)

  // Track shown errors to avoid duplicate toasts
  const shownErrorsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const errors = [
      // @ts-ignore
      productsError && String(productsError.error),
      // @ts-ignore
      versionsError && String(versionsError.error),
      // @ts-ignore
      childVersionsError && String(childVersionsError.error),
    ].filter(Boolean) as string[]

    errors.forEach((errorMsg) => {
      if (errorMsg && !shownErrorsRef.current.has(errorMsg)) {
        toast.error(errorMsg)
        shownErrorsRef.current.add(errorMsg)
      }
    })
  }, [productsError, versionsError, childVersionsError])

  const value: VersionsDataContextValue = {
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
    // loading
    isLoading: isLoadingTable,
    isFetchingNextPage,
    loadingProductVersions,
    // meta
    error,
  }

  return <VersionsDataContext.Provider value={value}>{children}</VersionsDataContext.Provider>
}
