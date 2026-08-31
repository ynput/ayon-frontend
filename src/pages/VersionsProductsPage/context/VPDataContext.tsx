import {
  EntityGroup,
  useGetVersionsByProductsQuery,
  useGetVersionsInfiniteQuery,
} from '@shared/api'
import { useGetProductsInfiniteQuery } from '@shared/api/queries'
import { flattenInfiniteVersionsData, flattenInfiniteProductsData } from '@shared/api'
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
  buildVPMaps,
  VersionNodeExtended,
  ProductNodeExtended,
  determineLoadingVP,
  extractFilters,
} from '../util'
import { useBuildVersionsTableData } from '../hooks/useBuildVersionsTableData'
import {
  checkColumnVisibility,
  getColumnSortKey,
  createFiltersFromSlicer,
  TableRow,
  useExpandedState,
  useProjectDataContext,
  useQueryFilters,
  buildQueryFilters,
  useSelectedFolders,
  useViewsContext,
} from '@shared/containers'
import { ExpandedState, OnChangeFn } from '@tanstack/react-table'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import {
  splitClientFiltersByScope,
  splitFiltersByScope,
} from '@shared/components/SearchFilter/useBuildFilterOptions'
import { useSlicerContext, useSelectedEntityIds } from '@shared/containers/Slicer'
import { useVPViewsContext } from './VPViewsContext'
import { useQueryArgumentChangeLoading } from '@shared/hooks'
import { toast } from 'react-toastify'
import { OnSyncDataCallback, useProjectFoldersContext, usePowerpack } from '@shared/context'
import type { FieldStats } from '@shared/api'
import { refreshActiveAndPurgeOthers, refreshOtherActiveQueries } from '@shared/api'
import {
  DEFAULT_FEATURED_ORDER,
  FEATURED_VERSION_TYPES,
} from '../../../../shared/src/components/FeaturedVersionOrder/FeaturedVersionOrder'
import useVersionsGroupBy from '../hooks/useVersionsGroupBy'
import { useVPColumnStats } from '../hooks/useVPColumnStats'
import { useAppDispatch } from '@state/store'

// Stable default filter to prevent unnecessary re-renders
const EMPTY_FILTER: QueryFilter = { conditions: [] }

const SORT_BY_FIELD_MAP: Record<string, string> = {
  name: 'path',
  subType: 'productType',
  folder_entity: 'folderName',
  product: 'productName',
}

// Define which sort fields are excluded for each entity type
const EXCLUDED_SORT_FIELDS: Record<'version' | 'product', string[]> = {
  version: [],
  product: ['author', 'product', 'name'],
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
  // combined filter strings (incl. slicer + entity-list selection) for the
  // column-summary stats queries
  columnStatsArgs: {
    projectName: string
    productFilter?: string
    versionFilter?: string
    taskFilter?: string
    folderFilter?: string
    folderIds?: string[]
    versionIds?: string[]
    productIds?: string[]
    latestPerFolder?: boolean
    featuredOnly?: string[]
    featuredOnlyEntityType?: string
  }
  // like columnStatsArgs but with the panel's own filter excluded — so slicer
  // value counts show each value's true population (no self-zeroing)
  getSlicerCountsArgs: (sliceType: string) => {
    projectName: string
    productFilter?: string
    versionFilter?: string
    taskFilter?: string
    folderFilter?: string
    folderIds?: string[]
    versionIds?: string[]
    productIds?: string[]
    latestPerFolder?: boolean
  }
  fieldStats: FieldStats[]
  groupFieldStats: FieldStats[]
  fieldStatsLoading: boolean
  fieldStatsError: unknown
  // data
  versionsTableData: TableRow[]
  versionsMap: VersionMap // root versions only
  groupedVersionsMap: VersionMap // grouped versions only
  childVersionsMap: VersionMap // child versions only
  allVersionsMap: VersionMap // all versions combined
  productsMap: ProductMap // all products
  entitiesMap: Map<string, VersionNodeExtended | ProductNodeExtended> // all versions and products
  hasNextPage: boolean | undefined
  fetchNextPage: (group?: string) => void
  // grouping
  groups: EntityGroup[]
  // loading
  isLoading: boolean
  isFetchingNextPage: boolean
  loadingProductVersions: Record<string, number> // product IDs to their version counts that are loading
  onSyncData: OnSyncDataCallback
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

export type QueryArguments = {
  projectName: string
  folderIds: string[]
  versionIds?: string[]
  productIds?: string[]
  versionFilter?: string
  productFilter?: string
  taskFilter?: string
  folderFilter?: string
  sortBy?: string
  desc: boolean
  featuredOnly?: string[]
  featuredOnlyEntityType?: string
  latestPerFolder?: boolean
  hasReviewables?: boolean
  showComments?: boolean
}

interface VersionsDataProviderProps {
  projectName: string
  children: ReactNode
  modules: any
}

export const VersionsDataProvider: FC<VersionsDataProviderProps> = ({
  projectName,
  children,
  modules,
}) => {
  const dispatch = useAppDispatch()
  const { attribFields } = useProjectDataContext()
  const { getFolderIdsWithoutChildren, getChildFolderIds } = useProjectFoldersContext()
  const {
    filters,
    showProducts,
    sortBy,
    sortDesc,
    featuredVersionOrder,
    latestPerFolder,
    groupBy,
    columns,
  } = useVPViewsContext()
  const { isLoadingViews: isLoadingViewSettings } = useViewsContext()

  // comments are the heaviest field to resolve, so only fetch them when the column is shown
  const showComments = useMemo(
    () => checkColumnVisibility(columns.columnVisibility || {}, 'comments'),
    [columns.columnVisibility],
  )

  const [expanded, setExpanded] = useState<ExpandedState>({})

  const {
    filters: filtersWithoutExtracted,
    featuredVersionFilter,
    hasReviewablesFilter,
  } = useMemo(() => {
    const FEATURED_VERSION_VALUES = FEATURED_VERSION_TYPES.map((type) => type.value)
    const result = extractFilters(filters, [
      {
        filterKey: 'version',
        valuesToExtract: FEATURED_VERSION_VALUES,
        resultKey: 'featuredVersionFilter',
      },
      {
        filterKey: 'hasReviewables',
        resultKey: 'hasReviewablesFilter',
        isBooleanFilter: true,
      },
    ])
    return {
      filters: result.filters,
      featuredVersionFilter: result.featuredVersionFilter as string[] | undefined,
      hasReviewablesFilter: result.hasReviewablesFilter as boolean | undefined,
    }
  }, [filters])

  // Separate the combined filters into version and product filters
  const {
    version: versionFilter = EMPTY_FILTER,
    product: productFilter = EMPTY_FILTER,
    task: taskFilter = EMPTY_FILTER,
    folder: folderFilter = EMPTY_FILTER,
  } = useMemo(() => {
    return splitFiltersByScope(filtersWithoutExtracted, ['version', 'product', 'task', 'folder'], {
      fallbackScope: 'version',
    })
  }, [filtersWithoutExtracted])

  const { updateExpanded, expandedIds } = useExpandedState({
    expanded,
    setExpanded,
  })

  // SLICER
  const { slices, getPanelSelection } = useSlicerContext()
  const { powerLicense, isLoading: isLoadingPowerLicense } = usePowerpack()

  // panels 2+ are license-gated; hold the first fetch until the license resolves
  const isLoadingViews = isLoadingViewSettings || (slices.length > 1 && isLoadingPowerLicense)

  // without a license only the first panel renders, so only it may contribute
  const sliceSelections = useMemo(() => {
    const all = slices.map((slice) => ({
      sliceType: slice.sliceType,
      rowSelection: getPanelSelection(slice.id),
    }))
    return powerLicense ? all : all.slice(0, 1)
  }, [slices, getPanelSelection, powerLicense])

  const sliceFilters = useMemo(
    () => createFiltersFromSlicer({ slices: sliceSelections, attribFields }),
    [sliceSelections, attribFields],
  )

  // Separate slicer filters into different types
  const vpValidScopes: ('version' | 'product' | 'task' | 'folder')[] = [
    'version',
    'product',
    'task',
    'folder',
  ]
  const attribScopeMap = useMemo(
    () =>
      attribFields.reduce<Record<string, string>>((acc, field) => {
        const scope = vpValidScopes.find((s) => field.scope?.includes(s))
        if (scope) acc[`attrib.${field.name}`] = scope
        return acc
      }, {}),
    [attribFields],
  )

  const {
    version: slicerVersionFilters,
    product: slicerProductFilters,
    task: slicerTaskFilters,
    folder: slicerFolderFilters,
  } = useMemo(() => {
    return splitClientFiltersByScope(sliceFilters, vpValidScopes, {
      status: 'version',
      taskType: 'task',
      productType: 'product',
      assignees: 'task',
      author: 'version',
      folderType: 'folder',
      ...attribScopeMap,
    })
  }, [sliceFilters, attribScopeMap])
  // Resolve entity list selections to IDs
  const { entityIds, rawEntityIds, parentMaps } = useSelectedEntityIds({
    slices: sliceSelections,
    projectName,
  })

  // get selected folders from slicer
  const { selectedFolders: selectedSlicerFolderIds, folderScope } = useSelectedFolders({
    slices: sliceSelections,
    entityListFolderIds: entityIds.folderIds,
    getChildFolderIds,
  })
  const slicerFolderIds = useMemo(
    () => getFolderIdsWithoutChildren(selectedSlicerFolderIds),
    [selectedSlicerFolderIds, getFolderIdsWithoutChildren],
  )

  // list entities narrowed to the hierarchy panel's subtree; ids not yet in
  // parentMaps pass through (the maps lag rawEntityIds by one resolve)
  const scopeEntityIds = useCallback(
    (ids: string[], folderIdMap: Record<string, string>) =>
      folderScope
        ? ids.filter((id) => {
            const folderId = folderIdMap[id]
            return !folderId || folderScope.has(folderId)
          })
        : ids,
    [folderScope],
  )
  const scopedVersionIds = useMemo(
    () => scopeEntityIds(entityIds.versionIds, parentMaps.versionFolderIds),
    [scopeEntityIds, entityIds.versionIds, parentMaps],
  )
  const scopedProductIds = useMemo(
    () => scopeEntityIds(entityIds.productIds, parentMaps.productFolderIds),
    [scopeEntityIds, entityIds.productIds, parentMaps],
  )
  const scopedTaskIds = useMemo(
    () => scopeEntityIds(rawEntityIds.taskIds, parentMaps.taskFolderIds),
    [scopeEntityIds, rawEntityIds.taskIds, parentMaps],
  )

  // combine slicer filters with version/product filters
  const combinedVersionFilter = useQueryFilters({
    queryFilters: versionFilter,
    sliceFilters: slicerVersionFilters,
  })
  const combinedProductFilter = useQueryFilters({
    queryFilters: productFilter,
    sliceFilters: slicerProductFilters,
  })
  const combinedTaskFilter = useQueryFilters({
    queryFilters: taskFilter,
    sliceFilters: slicerTaskFilters,
  })
  const combinedFolderFilter = useQueryFilters({
    queryFilters: folderFilter,
    sliceFilters: slicerFolderFilters,
    config: { searchKey: 'name' },
  })

  // When entity list has task IDs, merge them into the task filter
  const entityListTaskFilterString = useMemo(() => {
    if (!scopedTaskIds.length) return combinedTaskFilter.filterString

    const taskIdCondition = {
      key: 'id',
      operator: 'in',
      value: scopedTaskIds,
    }

    const existingFilter = combinedTaskFilter.filterString
      ? JSON.parse(combinedTaskFilter.filterString)
      : { conditions: [], operator: 'and' }

    return JSON.stringify({
      conditions: [...(existingFilter.conditions || []), taskIdCondition],
      operator: 'and',
    })
  }, [scopedTaskIds, combinedTaskFilter.filterString])

  // Slicer value counts: each panel's args exclude its OWN filter (so a selected
  // value keeps its siblings' true counts) but keep every other panel's filter
  // plus the hierarchy/entity-list ids — facet counts that match the filtered
  // table. With nothing selected all panels produce identical args, so their
  // stats queries collapse onto one shared cache entry.
  const getSlicerCountsArgs = useCallback(
    (sliceType: string) => {
      const otherSliceFilters = sliceFilters.filter((f) => f.id !== sliceType)
      const {
        version: otherVersionFilters,
        product: otherProductFilters,
        task: otherTaskFilters,
        folder: otherFolderFilters,
      } = splitClientFiltersByScope(otherSliceFilters, ['version', 'product', 'task', 'folder'], {
        status: 'version',
        taskType: 'task',
        productType: 'product',
        assignees: 'task',
        author: 'version',
        folderType: 'folder',
        ...attribScopeMap,
      })
      const countsVersionFilter = buildQueryFilters({
        queryFilters: versionFilter,
        sliceFilters: otherVersionFilters,
      })
      const countsProductFilter = buildQueryFilters({
        queryFilters: productFilter,
        sliceFilters: otherProductFilters,
      })
      const countsTaskFilter = buildQueryFilters({
        queryFilters: taskFilter,
        sliceFilters: otherTaskFilters,
      })
      const countsFolderFilter = buildQueryFilters({
        queryFilters: folderFilter,
        sliceFilters: otherFolderFilters,
        config: { searchKey: 'name' },
      })
      // a task-list panel narrows via task ids, like entityListTaskFilterString
      const countsTaskFilterString = scopedTaskIds.length
        ? JSON.stringify({
            conditions: [
              ...(countsTaskFilter.filter?.conditions || []),
              { key: 'id', operator: 'in', value: scopedTaskIds },
            ],
            operator: 'and',
          })
        : countsTaskFilter.filterString
      return {
        projectName,
        versionFilter: countsVersionFilter.filterString,
        productFilter: countsProductFilter.filterString,
        taskFilter: countsTaskFilterString,
        folderFilter: countsFolderFilter.filterString,
        folderIds: slicerFolderIds.length ? slicerFolderIds : undefined,
        versionIds: scopedVersionIds.length ? scopedVersionIds : undefined,
        productIds: scopedProductIds.length ? scopedProductIds : undefined,
        latestPerFolder,
      }
    },
    [
      sliceFilters,
      attribScopeMap,
      versionFilter,
      productFilter,
      taskFilter,
      folderFilter,
      projectName,
      slicerFolderIds,
      scopedVersionIds,
      scopedProductIds,
      scopedTaskIds,
      latestPerFolder,
    ],
  )

  const resolvedSortBy = useMemo(
    () => sortBy && (SORT_BY_FIELD_MAP[sortBy] || getColumnSortKey(sortBy, true, 'product')),
    [sortBy],
  )
  const queryArgs = useMemo(
    () => ({
      projectName,
      versionFilter: combinedVersionFilter.filterString,
      productFilter: combinedProductFilter.filterString,
      taskFilter: entityListTaskFilterString,
      folderFilter: combinedFolderFilter.filterString,
      folderIds: slicerFolderIds,
      versionIds: scopedVersionIds.length ? scopedVersionIds : undefined,
      productIds: scopedProductIds.length ? scopedProductIds : undefined,
      sortBy: resolvedSortBy,
      desc: sortDesc,
      showComments,
    }),
    [
      projectName,
      combinedVersionFilter.filterString,
      combinedProductFilter.filterString,
      entityListTaskFilterString,
      combinedFolderFilter.filterString,
      slicerFolderIds,
      scopedVersionIds,
      scopedProductIds,
      resolvedSortBy,
      sortDesc,
      showComments,
    ],
  )

  const {
    fieldStats,
    groupFieldStats,
    fieldStatsLoading,
    fieldStatsError,
    productStatsArgs,
    versionStatsArgs,
    isProductStatsUninitialized,
    isVersionStatsUninitialized,
  } = useVPColumnStats({
    productFilter: combinedProductFilter.filterString,
    versionFilter: combinedVersionFilter.filterString,
    taskFilter: entityListTaskFilterString,
    folderFilter: combinedFolderFilter.filterString,
    folderIds: slicerFolderIds.length ? slicerFolderIds : undefined,
    versionIds: scopedVersionIds.length ? scopedVersionIds : undefined,
    productIds: scopedProductIds.length ? scopedProductIds : undefined,
    featuredOnly: featuredVersionFilter,
    featuredOnlyEntityType: featuredVersionFilter?.length ? 'product' : undefined,
    latestPerFolder,
  })

  const resolveEntityArguments = useCallback(
    (entityType: 'version' | 'product'): QueryArguments => {
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

      const { versionIds, productIds, ...restQueryArgs } = queryArgs
      const args: any = {
        ...restQueryArgs,
        sortBy: modifiedSortBy,
      }

      if (entityType === 'version') {
        if (versionIds) {
          args.versionIds = versionIds
          args.folderIds = []
        } else if (productIds) {
          args.productIds = productIds
          args.folderIds = []
        }
      }
      if (entityType === 'product' && productIds) {
        args.productIds = productIds
        args.folderIds = []
      }

      if (entityType === 'product') {
        if (featuredVersionFilter) {
          // is there a version type filter, use that instead
          args.featuredVersionOrder = featuredVersionFilter
        } else {
          args.featuredVersionOrder = modifiedFeaturedVersionOrder
        }
      }

      if (entityType === 'version') {
        args.featuredOnly = featuredVersionFilter
        args.featuredOnlyEntityType = featuredVersionFilter?.length ? 'product' : undefined
        args.latestPerFolder = latestPerFolder

        if (hasReviewablesFilter !== undefined) {
          args.hasReviewables = hasReviewablesFilter
        }
      }

      return args
    },
    [
      queryArgs,
      resolvedSortBy,
      featuredVersionOrder,
      featuredVersionFilter,
      latestPerFolder,
      hasReviewablesFilter,
    ],
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
    isUninitialized: isProductsUninitialized,
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
    isUninitialized: isVersionsUninitialized,
    error: versionsError,
  } = useGetVersionsInfiniteQuery(versionArguments, {
    skip: showProducts || isLoadingViews,
    initialPageParam: {
      cursor: '',
      desc: sortDesc,
    },
  })

  const {
    groups,
    versions: groupedVersions,
    incrementPageCount: incrementGroupPage,
    isUninitialized: isGroupedVersionsUninitialized,
    queryArgs: groupedVersionsArgs,
  } = useVersionsGroupBy({
    projectName,
    versionFilters: combinedVersionFilter.combinedFilters,
    taskFilters: combinedTaskFilter.combinedFilters,
    folderFilter: combinedFolderFilter.filterString,
    modules,
    versionArguments,
    expanded,
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
    folderFilter: combinedFolderFilter.filterString,
    sortBy: versionArguments.sortBy,
    desc: versionArguments.desc,
    featuredOnly: versionArguments.featuredOnly,
    featuredOnlyEntityType: versionArguments.featuredOnlyEntityType,
    latestPerFolder: versionArguments.latestPerFolder,
    hasReviewables: versionArguments.hasReviewables,
    showComments,
  }

  // QUERY: get child versions for expanded products
  const {
    data: { versions: childVersions = [], errors: childVersionsErrors } = {},
    error: childVersionsError,
    isFetching: isFetchingChildren,
    isLoading: isLoadingChildren,
    isUninitialized: isChildrenUninitialized,
  } = useGetVersionsByProductsQuery(childVersionsArgs, { skip: !showProducts || isLoadingViews })

  const isLoadingChildVersions = useQueryArgumentChangeLoading(
    childVersionsArgs,
    isFetchingChildren || isLoadingChildren,
  )

  // Efficiently build all maps in a single pass using util
  let {
    versionsMap,
    childVersionsMap,
    allVersionsMap,
    productsMap,
    entitiesMap,
    groupedVersionsMap,
  } = useMemo(
    () => buildVPMaps(versions, childVersions, products, groupedVersions),
    [versions, childVersions, groupedVersions, products],
  )

  if (groupBy) {
    versionsMap = groupedVersionsMap
    entitiesMap = groupedVersionsMap
  }

  // Determine which products are currently loading versions
  const loadingProductVersions = useMemo(() => {
    return determineLoadingVP({
      childVersions,
      expandedProductIds: expandedIds,
      productsMap,
      hasFiltersApplied: (filters.conditions?.length || 0) > 0,
      isLoading: isLoadingChildVersions,
    })
  }, [childVersions, expandedIds, productsMap, isLoadingChildVersions, filters])

  const loadingProductVersionsFinished = useMemo(() => {
    // Return array of product IDs that have finished loading
    if (!expandedIds) return []

    // Products that have been fetched and are no longer fetching
    const finishedProducts = expandedIds.filter(
      (id) => !loadingProductVersions[id] && !isFetchingChildren,
    )

    return finishedProducts
  }, [expandedIds, loadingProductVersions, isFetchingChildren])

  const versionsTableData = useBuildVersionsTableData({
    rootVersionsMap: versionsMap,
    childVersionsMap,
    productsMap,
    showProducts,
    isFetchingNextPage,
    hasNextPage,
    loadingProductVersions,
    loadingProductVersionsFinished,
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

  const handleFetchNextPage = (group?: string) => {
    // check there is a next page
    if (!hasNextPage) return
    // check there aren't any errors
    if (error) return

    if (group) {
      incrementGroupPage(group)
    } else {
      fetchNextPage()
    }
  }

  const onSyncData: OnSyncDataCallback = async () => {
    const queriesToRefresh: { endpointName: string; args: unknown }[] = []

    if (showProducts && !isProductsUninitialized) {
      queriesToRefresh.push({ endpointName: 'getProductsInfinite', args: productArguments })
    }
    if (!showProducts && !isVersionsUninitialized) {
      queriesToRefresh.push({ endpointName: 'getVersionsInfinite', args: versionArguments })
    }
    if (!isChildrenUninitialized) {
      queriesToRefresh.push({ endpointName: 'getVersionsByProducts', args: childVersionsArgs })
    }
    if (!isGroupedVersionsUninitialized) {
      queriesToRefresh.push({
        endpointName: 'getGroupedVersionsList',
        args: groupedVersionsArgs,
      })
    }
    if (!isProductStatsUninitialized) {
      queriesToRefresh.push({ endpointName: 'GetProductsColumnStats', args: productStatsArgs })
    }
    if (!isVersionStatsUninitialized) {
      queriesToRefresh.push({ endpointName: 'GetVersionsColumnStats', args: versionStatsArgs })
    }

    await Promise.all(
      queriesToRefresh.map(({ endpointName, args }) =>
        dispatch(
          refreshActiveAndPurgeOthers(endpointName, args, {
            refreshOtherActiveQueries: false,
          }),
        ).unwrap(),
      ),
    )

    await Promise.all(
      queriesToRefresh.map(({ endpointName, args }) =>
        dispatch(refreshOtherActiveQueries(endpointName, args)),
      ),
    )
  }

  const value: VersionsDataContextValue = {
    versionFilter,
    productFilter,
    columnStatsArgs: {
      projectName,
      productFilter: combinedProductFilter.filterString,
      versionFilter: combinedVersionFilter.filterString,
      taskFilter: entityListTaskFilterString,
      folderFilter: combinedFolderFilter.filterString,
      // empty array means "match nothing" backend-side — omit when no slice
      folderIds: slicerFolderIds.length ? slicerFolderIds : undefined,
      versionIds: scopedVersionIds.length ? scopedVersionIds : undefined,
      productIds: scopedProductIds.length ? scopedProductIds : undefined,
      featuredOnly: versionStatsArgs.featuredOnly,
      featuredOnlyEntityType: versionStatsArgs.featuredOnlyEntityType,
      latestPerFolder: versionStatsArgs.latestPerFolder,
    },
    getSlicerCountsArgs,
    fieldStats,
    groupFieldStats,
    fieldStatsLoading,
    fieldStatsError,
    // expanded
    expanded,
    setExpanded,
    updateExpanded,
    // data
    versionsTableData,
    versionsMap,
    groupedVersionsMap,
    childVersionsMap,
    allVersionsMap,
    productsMap,
    entitiesMap,
    hasNextPage,
    fetchNextPage: handleFetchNextPage,
    // grouping
    groups,
    // loading
    isLoading: isLoadingTable,
    isFetchingNextPage,
    loadingProductVersions,
    onSyncData,
    // meta
    error,
  }

  return <VersionsDataContext.Provider value={value}>{children}</VersionsDataContext.Provider>
}
