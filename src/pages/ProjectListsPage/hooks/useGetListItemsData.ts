import { useGetListItemsInfiniteInfiniteQuery } from '@shared/api'
import type { EntityListItem, GetListItemsResult } from '@shared/api'
import { clientFilterToQueryFilter, FilterForQuery } from '@shared/containers/ProjectTreeTable'
import { SortingState } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface UseGetListItemsDataProps {
  projectName: string
  listId?: string
  sorting: SortingState
  filters?: FilterForQuery[]
  skip?: boolean
  entityType?: string
}

export interface UseGetListItemsDataReturn {
  data: EntityListItem[]
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
  filters = [],
  skip,
}: UseGetListItemsDataProps): UseGetListItemsDataReturn => {
  const queryFilter = clientFilterToQueryFilter(filters)
  const queryFilterString = filters.length ? JSON.stringify(queryFilter) : ''

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
    isLoading,
    isFetching,
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
  const [previousListId, setPreviousListId] = useState(listId)

  // Detect when listId changes to track fetching due to project change
  const isFetchingNewList = useMemo(() => {
    const isProjectChanged = previousListId !== listId
    if (isProjectChanged && !isFetching) {
      setPreviousListId(listId)
    }
    return isFetching && isProjectChanged
  }, [isFetching, isFetching, previousListId, listId])

  const handleFetchNextPage = () => {
    if (hasNextPage) {
      console.log('fetching next page')
      fetchNextPage()
    }
  }

  const buildPrivateItem = (i: GetListItemsResult['items'][number]): EntityListItem => ({
    active: true,
    name: 'private',
    id: 'private' + uuidv4().replace(/-/g, ''),
    entityId: i.entityId,
    entityType: 'unknown',
    allAttrib: '',
    attrib: {},
    ownAttrib: [],
    status: 'private',
    tags: [],
    updatedAt: '',
    position: 0,
    ownItemAttrib: [],
  })

  // Extract tasks from infinite query data correctly
  const data = useMemo(() => {
    if (!itemsInfiniteData?.pages) return []
    return itemsInfiniteData.pages.flatMap(
      (page) => page.items?.map((i) => (i ? i : buildPrivateItem(i))) || [],
    )
  }, [itemsInfiniteData?.pages])

  return {
    data,
    isLoading: isLoading || isFetchingNewList,
    isFetchingNextPage,
    isError,
    fetchNextPage: handleFetchNextPage,
  }
}

export default useGetListItemsData
