import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useGetEventsInfiniteInfiniteQuery } from '@queries/events/getEvents'
import type { EventFilters, EventItem } from '../types'
import { resolveEventFilters } from '../utils/datePresets'

export const useEventsData = (filters: EventFilters, skip: boolean) => {
  // by content: saving a view hands back an equal object, which must not move a rolling date range
  const resolvedFilters = useMemo(
    () => resolveEventFilters(filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters)],
  )
  const query = useGetEventsInfiniteInfiniteQuery(skip ? skipToken : resolvedFilters, {
    refetchOnMountOrArgChange: 30,
  })
  // `data` keeps the previous filter's result while the new one loads, so views don't flash empty
  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, error } =
    query

  const events = useMemo<EventItem[]>(() => {
    const seen = new Set<string>()
    const list: EventItem[] = []
    for (const page of data?.pages ?? []) {
      for (const event of page.events) {
        if (seen.has(event.id)) continue
        seen.add(event.id)
        list.push(event)
      }
    }
    // pages are ordered by creation order, which can differ from created_at (eg imported events)
    return list.sort((a, b) => b.createdAt - a.createdAt)
  }, [data])

  // refetching for new filters rather than loading older pages
  const isStale = isFetching && !isFetchingNextPage

  return {
    resolvedFilters,
    events,
    isLoading,
    isStale,
    isFetchingNextPage,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    error,
  }
}
