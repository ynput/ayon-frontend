import { useMemo } from 'react'
import type { EventItem } from '../types'
import { getCategory, KNOWN_CATEGORIES } from '../utils/eventMeta'

/** Counts of the loaded events, and the types to offer sorted by them */
export const useEventFacets = (events: EventItem[], selectedTypes?: string[]) => {
  const counts = useMemo(() => {
    const byCategory = new Map<string, number>()
    const byStatus = new Map<string, number>()
    const byTopic = new Map<string, number>()
    for (const e of events) {
      const c = getCategory(e.topic)
      byCategory.set(c, (byCategory.get(c) ?? 0) + 1)
      byStatus.set(e.status, (byStatus.get(e.status) ?? 0) + 1)
      byTopic.set(e.topic, (byTopic.get(e.topic) ?? 0) + 1)
    }
    return { byCategory, byStatus, byTopic }
  }, [events])

  const categories = useMemo(() => {
    const all = new Set([...KNOWN_CATEGORIES, ...counts.byCategory.keys(), ...(selectedTypes ?? [])])
    return [...all].sort(
      (a, b) =>
        (counts.byCategory.get(b) ?? 0) - (counts.byCategory.get(a) ?? 0) || a.localeCompare(b),
    )
  }, [counts.byCategory, selectedTypes])

  return { counts, categories }
}
