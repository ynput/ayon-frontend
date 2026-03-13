import { useCallback, useMemo } from 'react'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { useGetListsInfiniteInfiniteQuery } from '@shared/api/queries/entityLists/getLists'
import { useProjectContext } from '@shared/context'

interface UseEntityListsSliceProps {
  entityTypes: string[]
}

export const useEntityListsSlice = ({ entityTypes }: UseEntityListsSliceProps) => {
  const { projectName } = useProjectContext()

  const {
    data: listsData,
    isLoading,
    isFetching,
  } = useGetListsInfiniteInfiniteQuery(
    { projectName: projectName || '' },
    {
      initialPageParam: { cursor: '' },
      skip: !projectName,
    },
  )

  const tableData: SimpleTableRow[] = useMemo(() => {
    if (!listsData?.pages) return []

    const allLists = listsData.pages.flatMap((page) => page.lists)

    // Filter lists to only those whose entityType matches the page context
    const filteredLists = entityTypes.length
      ? allLists.filter((list) => entityTypes.includes(list.entityType))
      : allLists

    return filteredLists.map((list) => ({
      id: list.id,
      name: list.label,
      label: `${list.label} (${list.entityType})`,
      icon: 'list_alt',
      subRows: [],
      data: {
        id: list.id,
        name: list.label,
        label: `${list.label} (${list.entityType})`,
        entityType: list.entityType,
        listId: list.id,
      },
    }))
  }, [listsData, entityTypes])

  const getData = useCallback(async () => {
    return tableData
  }, [tableData])

  return {
    getData,
    isLoading: isLoading || isFetching,
  }
}
