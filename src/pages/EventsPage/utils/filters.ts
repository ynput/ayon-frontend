import type { EventFilters, EventItem } from '../types'
import { getCategory } from './eventMeta'

/**
 * Types, topics and severities are all topic selectors and combine as a union
 * ("entity events + errors"), every other filter narrows the result.
 */
export const getTopicPatterns = (filters: EventFilters): string[] | undefined => {
  const patterns = new Set<string>(filters.topics ?? [])
  const types = filters.types ?? []
  const severities = filters.severities ?? []

  for (const type of types) {
    // severities narrow the log type rather than adding to it
    if (type === 'log' && severities.length) continue
    patterns.add(`${type}.*`)
  }
  for (const severity of severities) patterns.add(`log.${severity}`)

  return patterns.size ? [...patterns] : undefined
}

export const buildGqlVariables = (filters: EventFilters) => {
  const topics = getTopicPatterns(filters)
  return {
    topics,
    includeLogs: !filters.hideLogs || !!topics,
    projects: filters.projects?.length ? filters.projects : undefined,
    users: filters.users?.length ? filters.users : undefined,
    statuses: filters.statuses?.length ? filters.statuses : undefined,
    newerThan: filters.newerThan,
    olderThan: filters.olderThan,
    filter: filters.search || undefined,
  }
}

type Condition = { key: string; value?: unknown; operator: string }
type QueryFilter = { conditions: (Condition | QueryFilter)[]; operator?: 'and' | 'or' }

/** The same filters expressed for the rest `/api/query` endpoint */
export const buildQueryFilter = (filters: EventFilters): QueryFilter => {
  const conditions: QueryFilter['conditions'] = []
  if (filters.entity) {
    conditions.push({ key: 'summary/entityId', value: filters.entity, operator: 'eq' })
  }
  const topics = getTopicPatterns(filters)
  if (topics) {
    conditions.push({
      operator: 'or',
      conditions: topics.map((t) => ({
        key: 'topic',
        value: t.replace(/\*/g, '%'),
        operator: 'like',
      })),
    })
  }
  if (filters.statuses?.length)
    conditions.push({ key: 'status', value: filters.statuses, operator: 'in' })
  if (filters.projects?.length)
    conditions.push({ key: 'project', value: filters.projects, operator: 'in' })
  if (filters.users?.length) conditions.push({ key: 'user', value: filters.users, operator: 'in' })
  if (filters.newerThan)
    conditions.push({ key: 'createdAt', value: filters.newerThan, operator: 'gte' })
  if (filters.olderThan)
    conditions.push({ key: 'createdAt', value: filters.olderThan, operator: 'lt' })
  for (const term of getSearchTerms(filters.search)) {
    conditions.push({
      operator: 'or',
      conditions: ['topic', 'project', 'user', 'description'].map((key) => ({
        key,
        value: `%${term}%`,
        operator: 'like',
      })),
    })
  }
  return { conditions, operator: 'and' }
}

// mirrors the server: terms shorter than three characters are ignored
const getSearchTerms = (search?: string) =>
  (search ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 3)

const patternToRegex = (pattern: string) =>
  new RegExp('^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')

/** Client side equivalent of the server filters, used for realtime events */
export const matchesFilters = (event: EventItem, filters: EventFilters): boolean => {
  const topics = getTopicPatterns(filters)
  if (topics) {
    if (!topics.some((p) => patternToRegex(p).test(event.topic))) return false
  } else if (filters.hideLogs && getCategory(event.topic) === 'log') return false

  if (filters.entity && event.summary.entityId !== filters.entity) return false
  if (filters.statuses?.length && !filters.statuses.includes(event.status)) return false
  if (filters.projects?.length && !filters.projects.includes(event.project ?? '')) return false
  if (filters.users?.length && !filters.users.includes(event.user ?? '')) return false
  if (filters.newerThan && event.createdAt < new Date(filters.newerThan).getTime()) return false
  if (filters.olderThan && event.createdAt >= new Date(filters.olderThan).getTime()) return false

  const haystack = [event.topic, event.project, event.user, event.description]
    .join(' ')
    .toLowerCase()
  return getSearchTerms(filters.search).every((term) => haystack.includes(term))
}
