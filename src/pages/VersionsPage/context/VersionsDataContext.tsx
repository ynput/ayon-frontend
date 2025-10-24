import { useGetVersionsByProductsQuery, useGetVersionsInfiniteQuery } from '@shared/api'
import { useGetProductsInfiniteQuery } from '@shared/api/queries'
import {
  flattenInfiniteVersionsData,
  flattenInfiniteProductsData,
} from '@shared/api/queries/versions/getVersionsUtils'
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react'
import {
  buildVersionsAndProductsMaps,
  VersionNodeExtended,
  ProductNodeExtended,
  determineLoadingProductVersions,
  getFeaturedVersionFilter,
} from '../util'
import { useBuildVersionsTableData } from '../hooks'
import {
  createFilterFromSlicer,
  TableRow,
  useExpandedState,
  useProjectDataContext,
  useQueryFilters,
  useSelectedFolders,
  useViewsContext,
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
import { DEFAULT_FEATURED_ORDER } from '../../../../shared/src/components/FeaturedVersionOrder/FeaturedVersionOrder'

// Stable default filter to prevent unnecessary re-renders
const EMPTY_FILTER: QueryFilter = { conditions: [] }

// Map UI sort values to API field names
const SORT_BY_FIELD_MAP: Record<string, string> = {
  name: 'path',
  subType: 'productType',
  folder: 'folderName',
  product: 'productName',
}

// Define which sort fields are excluded for each entity type
const EXCLUDED_SORT_FIELDS: Record<'version' | 'product', string[]> = {
  version: [],
  product: ['author'],
}

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
  const { filters, showProducts, sortBy, sortDesc, featuredVersionOrder } =
    useVersionsViewsContext()
  const { isLoadingViews } = useViewsContext()

  const [expanded, setExpanded] = useState<ExpandedState>({})

  const { filters: filtersWithoutFeatured, featuredVersionFilter } = useMemo(
    () => getFeaturedVersionFilter(filters),
    [filters],
  )

  // Separate the combined filters into version and product filters
  const {
    version: versionFilter = EMPTY_FILTER,
    product: productFilter = EMPTY_FILTER,
    task: taskFilter = EMPTY_FILTER,
  } = useMemo(() => {
    return splitFiltersByScope(filtersWithoutFeatured, ['version', 'product', 'task'])
  }, [filtersWithoutFeatured])

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

  console.log(sliceFilter)

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
        status: 'version',
        taskType: 'task',
        productType: 'product',
        assignees: 'task',
        author: 'version',
      },
    )
  }, [sliceFilter, showProducts])
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

  const resolvedSortBy = useMemo(() => (sortBy && SORT_BY_FIELD_MAP[sortBy]) || sortBy, [sortBy])

  const queryArgs = useMemo(
    () => ({
      projectName,
      versionFilter: combinedVersionFilter.filterString,
      productFilter: combinedProductFilter.filterString,
      taskFilter: combinedTaskFilter.filterString,
      folderIds: slicerFolderIds,
      sortBy: resolvedSortBy,
      desc: sortDesc,
    }),
    [
      projectName,
      combinedVersionFilter.filterString,
      combinedProductFilter.filterString,
      combinedTaskFilter.filterString,
      slicerFolderIds,
      resolvedSortBy,
      sortDesc,
    ],
  )

  const resolveEntityArguments = useCallback(
    (entityType: 'version' | 'product') => {
      // remove sortBy based on excluded
      const excludedFields = EXCLUDED_SORT_FIELDS[entityType]
      let modifiedSortBy =
        resolvedSortBy && excludedFields.some((field) => resolvedSortBy.includes(field))
          ? undefined
          : resolvedSortBy

      if (modifiedSortBy?.startsWith('attrib_')) {
        // replace _ with .
        modifiedSortBy = modifiedSortBy.replace('attrib_', 'attrib.')
      }

      const modifiedFeaturedVersionOrder = featuredVersionOrder?.length
        ? featuredVersionOrder
        : DEFAULT_FEATURED_ORDER

      const args: any = {
        ...queryArgs,
        sortBy: modifiedSortBy,
      }

      if (entityType === 'product') {
        if (featuredVersionFilter?.at) {
          // is there a version type filter, us that instead
          args.featuredVersionOrder = featuredVersionFilter
        } else {
          args.featuredVersionOrder = modifiedFeaturedVersionOrder
        }
      }

      if (entityType === 'version') {
        if (featuredVersionFilter?.length) {
          args.featuredOnly = featuredVersionFilter
        }
      }

      return args
    },
    [queryArgs, resolvedSortBy, featuredVersionOrder, featuredVersionFilter],
  )

  const productArguments = useMemo(
    () => resolveEntityArguments('product'),
    [resolveEntityArguments],
  )

  const versionArguments = useMemo(
    () => resolveEntityArguments('version'),
    [resolveEntityArguments],
  )

  // QUERY: Get all products when showing products
  const {
    data: productsData,
    hasNextPage: productsHasNextPage,
    fetchNextPage: productsFetchNextPage,
    isFetchingNextPage: productsIsFetchingNextPage,
    isFetching: isFetchingProducts,
    error: productsError,
  } = useGetProductsInfiniteQuery(productArguments, {
    skip: !showProducts || isLoadingViews,
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
  } = useGetVersionsInfiniteQuery(versionArguments, {
    skip: showProducts || isLoadingViews,
    initialPageParam: {
      cursor: '',
      desc: sortDesc,
    },
  })

  const isLoadingTable = useQueryArgumentChangeLoading(
    { ...queryArgs, featuredVersionOrder },
    isFetchingProducts || isFetchingVersions || isLoadingViews,
  )

  // Dynamic pagination based on showProducts
  const hasNextPage = showProducts ? productsHasNextPage : versionsHasNextPage
  const fetchNextPage = showProducts ? productsFetchNextPage : versionsFetchNextPage
  const isFetchingNextPage = showProducts ? productsIsFetchingNextPage : versionsIsFetchingNextPage

  const versions = useMemo(() => flattenInfiniteVersionsData(versionsData), [versionsData])
  const products = useMemo(() => flattenInfiniteProductsData(productsData), [productsData])

  const childVersionsArgs = {
    projectName: versionArguments.projectName,
    productIds: expandedIds,
    versionFilter: combinedVersionFilter.filterString,
    sortBy: versionArguments.sortBy,
    desc: versionArguments.desc,
    featuredOnly: versionArguments.featuredOnly,
  }

  // QUERY: get child versions for expanded products
  const {
    data: { versions: childVersions = [], errors: childVersionsErrors } = {},
    error: childVersionsError,
    isFetching: isFetchingChildren,
  } = useGetVersionsByProductsQuery(childVersionsArgs, { skip: !showProducts || isLoadingViews })

  const isLoadingChildVersions = useQueryArgumentChangeLoading(
    childVersionsArgs,
    isFetchingChildren,
  )

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
      isLoading: isLoadingChildVersions,
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

  const handleFetchNextPage = () => {
    // check there is a next page
    if (!hasNextPage) return
    // check there aren't any errors
    if (error) return

    fetchNextPage()
  }

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
    fetchNextPage: handleFetchNextPage,
    // loading
    isLoading: isLoadingTable,
    isFetchingNextPage,
    loadingProductVersions,
    // meta
    error,
  }

  return <VersionsDataContext.Provider value={value}>{children}</VersionsDataContext.Provider>
}
