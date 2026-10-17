import { useCallback, useMemo } from 'react'
import { ArrayParam, BooleanParam, StringParam, useQueryParams } from 'use-query-params'
import type { EventFilters, EventsView, Severity } from '../types'

const PARAMS = {
  q: StringParam,
  type: ArrayParam,
  topic: ArrayParam,
  severity: ArrayParam,
  status: ArrayParam,
  project: ArrayParam,
  user: ArrayParam,
  entity: StringParam,
  from: StringParam,
  to: StringParam,
  nologs: BooleanParam,
  view: StringParam,
  event: StringParam,
}

const clean = (values?: (string | null)[] | null) => {
  const list = (values ?? []).filter((v): v is string => !!v)
  return list.length ? list : undefined
}

/**
 * Filters, view and selection live in the url so an entity timeline or a single
 * event can be shared and survives reloads.
 */
export const useEventsUrlState = () => {
  const [query, setQuery] = useQueryParams(PARAMS)

  const filters = useMemo<EventFilters>(
    () => ({
      search: query.q || undefined,
      types: clean(query.type),
      topics: clean(query.topic),
      severities: clean(query.severity) as Severity[] | undefined,
      statuses: clean(query.status),
      projects: clean(query.project),
      users: clean(query.user),
      entity: query.entity || undefined,
      newerThan: query.from || undefined,
      olderThan: query.to || undefined,
      hideLogs: !!query.nologs || undefined,
    }),
    [query],
  )

  const setFilters = useCallback(
    (patch: Partial<EventFilters>) => {
      const next: Partial<Record<keyof typeof PARAMS, any>> = {}
      if ('search' in patch) next.q = patch.search || undefined
      if ('types' in patch) next.type = clean(patch.types)
      if ('topics' in patch) next.topic = clean(patch.topics)
      if ('severities' in patch) next.severity = clean(patch.severities)
      if ('statuses' in patch) next.status = clean(patch.statuses)
      if ('projects' in patch) next.project = clean(patch.projects)
      if ('users' in patch) next.user = clean(patch.users)
      if ('entity' in patch) next.entity = patch.entity || undefined
      if ('newerThan' in patch) next.from = patch.newerThan || undefined
      if ('olderThan' in patch) next.to = patch.olderThan || undefined
      if ('hideLogs' in patch) next.nologs = patch.hideLogs || undefined
      setQuery(next, 'replaceIn')
    },
    [setQuery],
  )

  const clearFilters = useCallback(
    () =>
      setQuery(
        {
          q: undefined,
          type: undefined,
          topic: undefined,
          severity: undefined,
          status: undefined,
          project: undefined,
          user: undefined,
          entity: undefined,
          from: undefined,
          to: undefined,
          nologs: undefined,
        },
        'replaceIn',
      ),
    [setQuery],
  )

  const view: EventsView = query.view === 'table' ? 'table' : 'timeline'
  const setView = useCallback(
    (v: EventsView) => setQuery({ view: v === 'timeline' ? undefined : v }, 'replaceIn'),
    [setQuery],
  )

  const selectedId = query.event || null
  const setSelectedId = useCallback(
    (id: string | null) => setQuery({ event: id || undefined }, 'replaceIn'),
    [setQuery],
  )

  return { filters, setFilters, clearFilters, view, setView, selectedId, setSelectedId }
}

export const countActiveFilters = (filters: EventFilters) =>
  Object.entries(filters).filter(([, v]) => (Array.isArray(v) ? v.length : !!v)).length
