import {
  QueryEntityListsItemsForReviewSession,
  useGetListsItemsForReviewSessionInfiniteQuery,
} from '@shared/api'
import { useMemo } from 'react'

interface Props {
  projectName: string
}

interface Return {
  data: QueryEntityListsItemsForReviewSession[]
  isLoading: boolean
  isFetchingNextPage: boolean
  isError: boolean
  fetchNextPage: () => void
}

const useGetListsItemsForReviewSession = ({ projectName }: Props): Return => {
  const {
    data: listsInfiniteData,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
  } = useGetListsItemsForReviewSessionInfiniteQuery(
    {
      projectName,
    },
    {
      initialPageParam: { cursor: '' },
      skip: !projectName,
    },
  )

  const handleFetchNextPage = () => {
    if (hasNextPage) {
      console.log('fetching next page')
      fetchNextPage()
    }
  }

  // Extract tasks from infinite query data correctly
  const data = useMemo(() => {
    if (!listsInfiniteData?.pages) return []
    return listsInfiniteData.pages.flatMap((page) => page.lists || [])
  }, [listsInfiniteData?.pages])

  return {
    data,
    isLoading: isLoading || isFetching,
    isFetchingNextPage,
    isError,
    fetchNextPage: handleFetchNextPage,
  }
}

export default useGetListsItemsForReviewSession
