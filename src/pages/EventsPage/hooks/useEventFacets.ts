import { useMemo } from 'react'
import type { EventItem } from '../types'
import { getCategory, getCategoryMeta, KNOWN_CATEGORIES } from '../utils/eventMeta'

/** Exact topics plus their wildcard groups, eg `entity.task.*` for `entity.task.status_changed` */
const buildTopicOptions = (topicCounts: Map<string, number>) => {
  const counts = new Map<string, number>(topicCounts)
  for (const [topic, count] of topicCounts) {
    const parts = topic.split('.')
    for (let i = 1; i < parts.length; i++) {
      const group = `${parts.slice(0, i).join('.')}.*`
      counts.set(group, (counts.get(group) ?? 0) + count)
    }
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => a.value.localeCompare(b.value))
}

/** Counts of the loaded events, the types to offer and the topics to suggest */
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
    // a fixed order: counts change with the filters, and rows must not move when clicked
    return [...all].sort((a, b) => getCategoryMeta(a).label.localeCompare(getCategoryMeta(b).label))
  }, [counts.byCategory, selectedTypes])

  const topics = useMemo(() => buildTopicOptions(counts.byTopic), [counts.byTopic])

  return { counts, categories, topics }
}
