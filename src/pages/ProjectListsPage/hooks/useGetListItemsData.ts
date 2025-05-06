import {
  EntityListItem,
  GetListItemsResult,
  useGetListItemsInfiniteInfiniteQuery,
} from '@queries/lists/getLists'
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
  sorting,
  filters = [],
  skip,
}: UseGetListItemsDataProps): UseGetListItemsDataReturn => {
  const queryFilter = clientFilterToQueryFilter(filters)
  const queryFilterString = filters.length ? JSON.stringify(queryFilter) : ''

  // Create sort params for infinite query
  const singleSort = { ...sorting[0] }
  // if task list and sorting by name, sort by path instead
  const sortByPath = singleSort?.id === 'name'
  const sortId = sortByPath ? 'path' : singleSort?.id

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
      sortBy: sortId,
      desc: singleSort?.desc,
      // filter: queryFilterString,
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
    status: 'private',
    tags: [],
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
