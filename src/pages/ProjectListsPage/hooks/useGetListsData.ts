import { EntityList, useGetListsInfiniteInfiniteQuery } from '@shared/api'
import { clientFilterToQueryFilter, FilterForQuery } from '@shared/containers/ProjectTreeTable'
import { useMemo, useState } from 'react'

interface UseGetListsDataProps {
  projectName: string
  filters: FilterForQuery[]
  skip?: boolean
}

export interface UseGetListsDataReturn {
  data: EntityList[]
  isLoading: boolean
  isFetchingNextPage: boolean
  isError: boolean
  fetchNextPage: () => void
}

const useGetListsData = ({
  projectName,
  filters,
  skip,
}: UseGetListsDataProps): UseGetListsDataReturn => {
  const queryFilter = clientFilterToQueryFilter(filters)
  const queryFilterString = filters.length ? JSON.stringify(queryFilter) : ''

  const {
    data: listsInfiniteData,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
  } = useGetListsInfiniteInfiniteQuery(
    {
      projectName,
      filter: queryFilterString,
    },
    {
      initialPageParam: { cursor: '' },
      skip: !projectName || skip,
    },
  )
  const [previousProjectName, setPreviousProjectName] = useState(projectName)

  // Detect when projectName changes to track fetching due to project change
  const isFetchingNewProject = useMemo(() => {
    const isProjectChanged = previousProjectName !== projectName
    if (isProjectChanged && !isFetching) {
      setPreviousProjectName(projectName)
    }
    return isFetching && isProjectChanged
  }, [isFetching, isFetching, previousProjectName, projectName])

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
    isLoading: isLoading || isFetchingNewProject,
    isFetchingNextPage,
    isError,
    fetchNextPage: handleFetchNextPage,
  }
}

export default useGetListsData
