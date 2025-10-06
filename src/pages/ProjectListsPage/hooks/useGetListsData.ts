import { EntityList, useGetListsInfiniteInfiniteQuery } from '@shared/api'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import { useMemo, useState } from 'react'

interface UseGetListsDataProps {
  projectName: string
  filters: QueryFilter
  skip?: boolean
  entityListTypes?: string[] // filter by entityListType
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
  entityListTypes,
}: UseGetListsDataProps): UseGetListsDataReturn => {
  // Create entity list type filter condition
  const entityListTypeCondition = entityListTypes?.length
    ? {
        key: 'entityListType',
        operator: 'in' as const,
        value: entityListTypes,
      }
    : null

  // Merge filters with entity list type condition
  const queryFilter: QueryFilter =
    filters && Object.keys(filters).length > 0
      ? {
          operator: 'and',
          conditions: [
            ...(filters.conditions || []),
            ...(entityListTypeCondition ? [entityListTypeCondition] : []),
          ],
        }
      : entityListTypeCondition
      ? { operator: 'and', conditions: [entityListTypeCondition] }
      : {}

  const queryFilterString = Object.keys(queryFilter).length ? JSON.stringify(queryFilter) : ''

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
