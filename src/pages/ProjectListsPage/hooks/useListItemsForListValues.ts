import { useCallback, useMemo } from 'react'
import { useGetListItemsQuery } from '@shared/api'
import { useProjectContext } from '@shared/context'
import type { UseListItems } from '../listValues/types'
import type { EntityListItemWithLinks } from './useGetListItemsData'
import { useListsDataContext } from '../context/lists-data'
import { isTooBigToCompare, MAX_COMPARE_ITEMS } from '../listValues/compareLimit'

const listItemsArgs = (projectName: string, listId?: string, filter?: string, search?: string) => ({
  projectName,
  listId: listId || '',
  first: MAX_COMPARE_ITEMS,
  filter,
  search,
})

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
    listItemsArgs(projectName, listId, filter, search),
    { skip: isSkipped },
  )

  // more items than one query loads: never compare with a part of the list
  const isIncomplete = !!data?.pageInfo.hasNextPage
  const items = useMemo(
    () => data?.items.map((item) => ({ ...item, links: [] } as unknown as EntityListItemWithLinks)),
    [data],
  )
  const refetchItems = useCallback(() => {
    if (!isSkipped) refetch()
  }, [isSkipped, refetch])

  return { items: isSkipped || isIncomplete ? undefined : items, refetch: refetchItems }
}

// Whether a list is too big to compare: its count, or for a list the sidebar hasn't loaded
// (hidden by its filters), its whole-list query, the same one the module makes
export const useCompareListTooBig = (listId?: string) => {
  const { projectName } = useProjectContext()
  const { listsMap } = useListsDataContext()
  const list = listId ? listsMap.get(listId) : undefined
  const { data } = useGetListItemsQuery(listItemsArgs(projectName, listId), {
    skip: !listId || !projectName || !!list,
  })
  return !!listId && (list ? isTooBigToCompare(list) : !!data?.pageInfo.hasNextPage)
}
