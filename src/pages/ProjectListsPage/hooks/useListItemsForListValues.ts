import { useCallback, useMemo } from 'react'
import { useGetListItemsQuery } from '@shared/api'
import { useProjectContext } from '@shared/context'
import type { UseListItems } from '../listValues/types'
import type { EntityListItemWithLinks } from './useGetListItemsData'
import { useListsDataContext } from '../context/lists-data'
import { isTooBigToCompare, MAX_COMPARE_ITEMS } from '../listValues/compareLimit'

// The ListValues module's UseListItems: a list's items, through the page's query cache
export const useListItemsForListValues: UseListItems<EntityListItemWithLinks> = ({
  listId,
  filter,
  search,
  skip,
}) => {
  const { projectName } = useProjectContext()
  const { listsMap } = useListsDataContext()
  // too big lists aren't loaded at all: the Lists page turns compare off for them
  const isTooBig = !!listId && isTooBigToCompare(listsMap.get(listId))
  const isSkipped = !!skip || !listId || !projectName || isTooBig
  const { data, refetch } = useGetListItemsQuery(
    { projectName, listId: listId || '', first: MAX_COMPARE_ITEMS, filter, search },
    { skip: isSkipped },
  )

  const items = useMemo(
    () => data?.items.map((item) => ({ ...item, links: [] } as unknown as EntityListItemWithLinks)),
    [data],
  )
  const refetchItems = useCallback(() => {
    if (!isSkipped) refetch()
  }, [isSkipped, refetch])

  return { items: isSkipped ? undefined : items, refetch: refetchItems }
}
