import {
  buildMetricTargets,
  mergeFieldStats,
  refreshActiveAndPurgeOthers,
  refreshOtherActiveQueries,
  shouldSkipColumnStats,
  toListItemsStatsTargets,
  totalRowsFromStats,
  useGetEntityLinksQuery,
  useGetListItemsColumnStatsQuery,
  useGetListItemsInfiniteInfiniteQuery,
  SubTaskNode,
} from '@shared/api'
import type { EntityListItem, FieldStats, GetListItemsResult, StatsEntity } from '@shared/api'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import { SortingState } from '@tanstack/react-table'
import { useMemo } from 'react'
import type { EntityLink } from '@shared/api/queries/links/getEntityLinks'
import {
  RESTRICTED_ENTITY_TYPE,
  RESTRICTED_ENTITY_NAME,
} from '@shared/containers/ProjectTreeTable/utils/restrictedEntity'
import { sanitizeQueryFilter } from '@shared/containers/ProjectTreeTable/utils/sanitizeQueryFilter'
import { expandRelativeDates } from '@shared/containers/ProjectTreeTable/utils/expandRelativeDates'
import { useQueryArgumentChangeLoading } from '@shared/hooks'
import { buildSortArgs } from '@shared/util'
import { extractSearchFromFilters } from '../util/searchToQueryFilter'
import { OnSyncDataCallback, usePowerpack, useProjectContext } from '@shared/context'
import { useListsViewSettings, useProjectDataContext, useViewsContext } from '@shared/containers'
import { getColumnSortKey } from '@shared/containers/ProjectTreeTable/buildTreeTableColumns'
import { useAppDispatch } from '@state/store'
import { COMPARE_ENTITY_COLUMN_PREFIX } from '../listValues/columns'
import { toEntityValueKeys } from '../listValues/entityValueFilter'

// Extend EntityListItem to include links
export type EntityListItemWithLinks = Omit<EntityListItem, 'subtasks'> & {
  links: EntityLink[]
  subtasks?: SubTaskNode[]
}

interface UseGetListItemsDataProps {
  projectName: string
  listId?: string
  sorting: SortingState
  filters?: QueryFilter
  skip?: boolean
  entityType?: string
  skipLinks?: boolean
  showComments?: boolean
  isLoadingViews: boolean
  defaultColumnVisibility: Record<string, boolean>
  // attributes the table shows from the entity, so they sort and filter by entity values
  readsEntityValue?: (attrib: string) => boolean
}

export interface UseGetListItemsDataReturn {
  data: EntityListItemWithLinks[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  // the query's filter (JSON) and search, e.g. to query another list the same way
  queryFilter?: string
  search?: string
  isError: boolean
  error?: unknown

  refetch: () => void
  fetchNextPage: () => void
  onSyncData: OnSyncDataCallback
  fieldStats: FieldStats[]
  fieldStatsLoading: boolean
  fieldStatsError: boolean
  mainCountLabels: { primary: string }
}

const useGetListItemsData = ({
  projectName,
  listId,
  entityType,
  sorting,
  filters = { conditions: [], operator: 'and' },
  skip,
  skipLinks = true,
  showComments = false,
  isLoadingViews,
  defaultColumnVisibility,
  readsEntityValue,
}: UseGetListItemsDataProps): UseGetListItemsDataReturn => {
  const dispatch = useAppDispatch()
  const { projectName: contextProjectName } = useProjectContext()
  const { attribFields } = useProjectDataContext()
  const { columns } = useListsViewSettings()
  const { powerLicense } = usePowerpack()
  const { isLoadingViews: areViewsLoading } = useViewsContext()
  const statsEntity = (
    entityType === 'folder' ||
    entityType === 'task' ||
    entityType === 'product' ||
    entityType === 'version'
      ? entityType
      : undefined
  ) as StatsEntity | undefined
  const statsProjectName = contextProjectName || projectName
  const { search, filters: filtersWithoutSearch } = extractSearchFromFilters(filters)
  const queryFilterString = filtersWithoutSearch.conditions?.length
    ? JSON.stringify(
        toEntityValueKeys(
          sanitizeQueryFilter(expandRelativeDates(filtersWithoutSearch)),
          readsEntityValue,
        ),
      )
    : ''

  // Create sort params for infinite query
  const parseSorting = (sorting?: string): string | undefined => {
    if (!sorting) return undefined
    const sortId = getColumnSortKey(sorting, true, entityType) ?? ''
    const scopedTypeSortKeys: Record<string, string> = {
      folder_subType: entityType === 'folder' ? 'entity_folderType' : 'parentFolderType',
      task_subType: entityType === 'task' ? 'entity_taskType' : 'parentTaskType',
      product_subType: entityType === 'product' ? 'entity_productType' : 'parentProductType',
    }

    if (scopedTypeSortKeys[sorting]) return scopedTypeSortKeys[sorting]
    // compare view column with the entities' values
    if (sorting.startsWith(COMPARE_ENTITY_COLUMN_PREFIX)) {
      return `entityAttrib.${sorting.slice(COMPARE_ENTITY_COLUMN_PREFIX.length)}`
    }

    let parsedSortId = sortId
    if (sorting === 'name' && entityType === 'version') {
      parsedSortId = 'path'
    } else if (parsedSortId.startsWith('attrib') && parsedSortId.includes('_')) {
      // convert attrib sorting to query format
      const attrib = parsedSortId.slice(parsedSortId.indexOf('_') + 1)
      parsedSortId = readsEntityValue?.(attrib) ? `entityAttrib.${attrib}` : `attrib.${attrib}`
    } else if (sorting === 'subType') {
      switch (entityType) {
        case 'task':
          parsedSortId = 'entity_taskType'
          break
        case 'folder':
          parsedSortId = 'entity_folderType'
          break
        case 'product':
          parsedSortId = 'parent_productType'
          break
        case 'version':
          parsedSortId = 'parent_productType'
          break
      }
    } else if (parsedSortId === 'product') {
      // backend resolves productName to the related product's name (per entity type)
      parsedSortId = 'productName'
    } else if (sorting === 'folder_entity' || sorting === 'folder') {
      parsedSortId = 'folderPath'
    } else {
      // add entity prefix to entity fields
      parsedSortId = `entity_${parsedSortId}`
    }

    return parsedSortId
  }

  const { sortBy, desc } = buildSortArgs(
    sorting.map((sort) => ({ key: parseSorting(sort.id), desc: sort.desc })),
  )

  const listItemsArgs = {
    projectName,
    listId: listId || '',
    sortBy,
    desc,
    filter: queryFilterString || undefined,
    search,
    showComments,
  }

  const {
    data: itemsInfiniteData,
    isLoading: isLoadingRaw,
    isFetching: isFetchingListItems,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    error,
    refetch: refetchListItems,
  } = useGetListItemsInfiniteInfiniteQuery(listItemsArgs, {
    initialPageParam: { cursor: '' },
    skip: !projectName || !listId || isLoadingViews || skip,
  })

  // Only show loading when query arguments change, not on background refetches
  const isFetching = useQueryArgumentChangeLoading(
    {
      projectName: projectName || '',
      listId: listId || '',
      sortBy: sortBy?.toString() || '',
      desc,
      filter: queryFilterString || '',
      search: search || '',
    },
    isFetchingListItems,
  )

  const isLoading = isLoadingRaw || isFetching

  const statsTargets = useMemo(
    () =>
      statsEntity
        ? toListItemsStatsTargets(
            buildMetricTargets({
              entity: statsEntity,
              attribs: attribFields.filter((field) => field.scope?.includes(statsEntity)),
              columnVisibility: columns.columnVisibility,
              defaultColumnVisibility,
              columnSummaries: columns.columnSummaries,
              columnSummaryScopes: columns.columnSummaryScopes,
            }),
          )
        : [],
    [
      statsEntity,
      attribFields,
      columns.columnVisibility,
      columns.columnSummaries,
      columns.columnSummaryScopes,
      defaultColumnVisibility,
    ],
  )

  const statsFilter = queryFilterString || undefined
  const statsArgs = {
    projectName: statsProjectName,
    listId: listId || '',
    filter: statsFilter,
    search,
    targets: statsTargets,
  }
  const skipStats =
    !statsProjectName ||
    !listId ||
    !statsEntity ||
    !powerLicense ||
    isLoadingViews ||
    areViewsLoading ||
    shouldSkipColumnStats(
      columns.columnSummaries,
      columns.columnSummaryScopes,
      columns.columnVisibility,
      defaultColumnVisibility,
    )
  const {
    data: itemStats,
    isLoading: fieldStatsLoading,
    isError: fieldStatsError,
    isUninitialized: isStatsUninitialized,
  } = useGetListItemsColumnStatsQuery(statsArgs, { skip: skipStats })

  const fieldStats = useMemo(() => {
    const items = itemStats ?? []
    const mainCount: FieldStats = {
      columnName: 'name',
      primaryCount: itemStats ? totalRowsFromStats(items) : undefined,
    }
    return mergeFieldStats([...items, mainCount])
  }, [itemStats])

  const handleFetchNextPage = () => {
    if (hasNextPage) {
      console.log('fetching next page')
      fetchNextPage()
    }
  }
  const buildRestrictedItem = (
    i: GetListItemsResult['items'][number],
  ): EntityListItemWithLinks => ({
    active: true,
    name: RESTRICTED_ENTITY_NAME,
    id: i.id, // Use the actual list item ID from the backend
    entityId: i.entityId,
    entityType: RESTRICTED_ENTITY_TYPE,
    allAttrib: '',
    itemAttrib: '',
    entityAllAttrib: '',
    attrib: {},
    listAttrib: {},
    entityAttrib: {},
    ownAttrib: [],
    status: '',
    tags: [],
    updatedAt: '',
    createdAt: '', // <-- required to match EntityListItemWithLinks type
    position: 0,
    ownItemAttrib: [],
    links: [],
    parents: [],
    subtasks: [],
  })

  // Extract tasks from infinite query data correctly
  const data = useMemo(() => {
    if (!itemsInfiniteData?.pages) return []
    return itemsInfiniteData.pages.flatMap(
      (page) =>
        page.items?.map((i) => {
          // Check if item is restricted (has entityType 'unknown' or missing name)
          if (!i || i.entityType === RESTRICTED_ENTITY_TYPE || !i.name) {
            return buildRestrictedItem(i)
          }
          return i
        }) || [],
    )
  }, [itemsInfiniteData?.pages])

  // Get visible entities for link fetching
  const visibleEntityIds = useMemo(() => {
    return new Set(data.map((item) => item.entityId))
  }, [data])

  // Get all links for visible entities
  const linksArgs = {
    projectName,
    entityIds: Array.from(visibleEntityIds),
    entityType: entityType as
      | 'folder'
      | 'task'
      | 'product'
      | 'version'
      | 'representation'
      | 'workfile',
  }
  const { data: linksData = [], isUninitialized: isLinksUninitialized } = useGetEntityLinksQuery(
    linksArgs,
    {
      skip: visibleEntityIds.size === 0 || !entityType || skip || skipLinks, // Skip if no visible entities, no entity type, or if skipLinks is true
    },
  )

  // Create a map of links by entity ID for efficient lookups
  const linksMap = useMemo(() => {
    return new Map(linksData.map((entityWithLinks) => [entityWithLinks.id, entityWithLinks.links]))
  }, [linksData])

  // Enhance data with links
  const dataWithLinks = useMemo(() => {
    return data.map((item) => ({
      ...item,
      links: linksMap.get(item.entityId) || [],
    }))
  }, [data, linksMap])

  const onSyncData: OnSyncDataCallback = async (updates = []) => {
    const isFullSync = updates.length === 0
    const hasListItemUpdates = updates.some((update) =>
      update.topic.startsWith('entity_list.changed'),
    )
    const hasLinkUpdates = updates.some((update) => update.topic.startsWith('link'))

    const syncLinks = (isFullSync || hasLinkUpdates) && !isLinksUninitialized
    const syncListItems = isFullSync || hasListItemUpdates
    const syncStats = (isFullSync || hasListItemUpdates) && !isStatsUninitialized

    if (!syncLinks && !syncListItems && !syncStats) return

    const queriesToRefresh: { endpointName: string; args: unknown }[] = []
    if (syncLinks) queriesToRefresh.push({ endpointName: 'getEntityLinks', args: linksArgs })
    if (syncListItems) {
      queriesToRefresh.push({ endpointName: 'getListItemsInfinite', args: listItemsArgs })
    }
    if (syncStats) {
      queriesToRefresh.push({ endpointName: 'GetListItemsColumnStats', args: statsArgs })
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

  return {
    data: dataWithLinks,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    queryFilter: queryFilterString || undefined,
    search,
    onSyncData,
    isError,
    error,
    fetchNextPage: handleFetchNextPage,
    refetch: refetchListItems,
    fieldStats,
    fieldStatsLoading,
    fieldStatsError,
    mainCountLabels: { primary: statsEntity ? `${statsEntity}s` : 'items' },
  }
}

export default useGetListItemsData
