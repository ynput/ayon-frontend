import { useGetListItemsInfiniteInfiniteQuery, useGetEntityLinksQuery } from '@shared/api'
import type { EntityListItem, GetListItemsResult } from '@shared/api'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import { SortingState } from '@tanstack/react-table'
import { useMemo } from 'react'
import type { EntityLink } from '@shared/api/queries/links/getEntityLinks'
import {
  RESTRICTED_ENTITY_TYPE,
  RESTRICTED_ENTITY_NAME,
} from '@shared/containers/ProjectTreeTable/utils/restrictedEntity'
import { useQueryArgumentChangeLoading } from '@shared/hooks'

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
}

export interface UseGetListItemsDataReturn {
  data: EntityListItemWithLinks[]
  isLoading: boolean
  isFetchingNextPage: boolean
  isError: boolean
  fetchNextPage: () => void
}

const useGetListItemsData = ({
  projectName,
  listId,
  entityType,
  sorting,
  filters = { conditions: [], operator: 'and' },
  skip,
}: UseGetListItemsDataProps): UseGetListItemsDataReturn => {
  const queryFilterString = filters.conditions?.length ? JSON.stringify(filters) : ''

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
    } else {
      // add entity prefix to entity fields
      sortId = `entity_${sortId}`
    }

    return sortId
  }

  const {
    data: itemsInfiniteData,
    isLoading: isLoadingRaw,
    isFetching: isFetchingRaw,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
  } = useGetListItemsInfiniteInfiniteQuery(
    {
      projectName,
      listId: listId || '',
      sortBy: parseSorting(singleSort?.id),
      desc: singleSort?.desc,
      filter: queryFilterString || undefined,
    },
    {
      initialPageParam: { cursor: '' },
      skip: !projectName || !listId || skip,
    },
  )

  // Only show loading when query arguments change, not on background refetches
  const isFetching = useQueryArgumentChangeLoading(
    {
      projectName: projectName || '',
      listId: listId || '',
      sortBy: parseSorting(singleSort?.id) || '',
      desc: singleSort?.desc || false,
      filter: queryFilterString || '',
    },
    isFetchingRaw,
  )

  const isLoading = isLoadingRaw || isFetching

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
  const { data: linksData = [] } = useGetEntityLinksQuery(
    {
      projectName,
      entityIds: Array.from(visibleEntityIds),
      entityType: entityType as
        | 'folder'
        | 'task'
        | 'product'
        | 'version'
        | 'representation'
        | 'workfile',
    },
    {
      skip: visibleEntityIds.size === 0 || !entityType,
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

  return {
    data: dataWithLinks,
    isLoading,
    isFetchingNextPage,
    isError,
    fetchNextPage: handleFetchNextPage,
  }
}

export default useGetListItemsData
