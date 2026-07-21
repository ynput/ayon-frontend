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
import { OnSyncDataCallback, usePowerpack, useProjectContext } from '@shared/context'
import { useListsViewSettings, useProjectDataContext, useViewsContext } from '@shared/containers'
import { useAppDispatch } from '@state/store'

// Extend EntityListItem to include links
export type EntityListItemWithLinks = EntityListItem & {
  links: EntityLink[]
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
}

export interface UseGetListItemsDataReturn {
  data: EntityListItemWithLinks[]
  isLoading: boolean
  isFetchingNextPage: boolean
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
  const queryFilterString = filters.conditions?.length
    ? JSON.stringify(sanitizeQueryFilter(expandRelativeDates(filters)))
    : ''

  // Create sort params for infinite query
  const singleSort = { ...sorting[0] }
  const parseSorting = (sorting?: string): string | undefined => {
    if (!sorting) return undefined
    let sortId = sorting
    if (singleSort?.id === 'name' && entityType === 'version') {
      sortId = 'path'
    } else if (sortId.startsWith('attrib') && sortId.includes('_')) {
      // convert attrib sorting to query format
      sortId = sortId.replace('_', '.')
    } else if (sortId.endsWith('Type') && entityType && !sortId.startsWith(entityType)) {
      // if the type is not native to the entity, add the parent prefix
      sortId = 'parent' + sortId[0].toUpperCase() + sortId.slice(1)
    } else if (sortId === 'product') {
      // backend resolves productName to the related product's name (per entity type)
      sortId = 'productName'
    } else if (sortId === 'folder') {
      sortId = 'folderPath'
    } else {
      // add entity prefix to entity fields
      sortId = `entity_${sortId}`
    }

    return sortId
  }

  const listItemsArgs = {
    projectName,
    listId: listId || '',
    sortBy: parseSorting(singleSort?.id),
    desc: singleSort?.desc,
    filter: queryFilterString || undefined,
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
      sortBy: parseSorting(singleSort?.id) || '',
      desc: singleSort?.desc || false,
      filter: queryFilterString || '',
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

  const statsFilter = filters.conditions?.length
    ? JSON.stringify(sanitizeQueryFilter(expandRelativeDates(filters)))
    : undefined
  const statsArgs = {
    projectName: statsProjectName,
    listId: listId || '',
    filter: statsFilter,
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
    attrib: {},
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
