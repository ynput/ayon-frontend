import { useCallback, useEffect, useMemo, useRef } from 'react'
import { isEqual } from 'lodash'
import { ArrayParam, BooleanParam, StringParam, useQueryParams } from 'use-query-params'
import { useViewsContext, useViewsState } from '@shared/containers'
import type { EventFilters, EventsLayout, EventsViewSettings, Severity } from '../types'

const PARAMS = {
  q: StringParam,
  type: ArrayParam,
  topic: ArrayParam,
  severity: ArrayParam,
  status: ArrayParam,
  project: ArrayParam,
  user: ArrayParam,
  entity: StringParam,
  range: StringParam,
  from: StringParam,
  to: StringParam,
  nologs: BooleanParam,
  layout: StringParam,
  event: StringParam,
}

type Query = { [K in keyof typeof PARAMS]?: any }

const NO_FILTERS: EventFilters = {}
const DEFAULT_LAYOUT: EventsLayout = 'table'

const clean = (values?: (string | null)[] | null) => {
  const list = (values ?? []).filter((v): v is string => !!v)
  return list.length ? list : undefined
}

/** Drops empty values, so saved settings and links compare equal when they mean the same thing */
const cleanFilters = (filters: EventFilters): EventFilters =>
  Object.fromEntries(
    Object.entries(filters).filter(([, v]) => (Array.isArray(v) ? v.length : !!v)),
  ) as EventFilters

const filtersFromQuery = (query: Query): EventFilters =>
  cleanFilters({
    search: query.q,
    types: clean(query.type),
    topics: clean(query.topic),
    severities: clean(query.severity) as Severity[] | undefined,
    statuses: clean(query.status),
    projects: clean(query.project),
    users: clean(query.user),
    entity: query.entity,
    datePreset: query.range,
    newerThan: query.from,
    olderThan: query.to,
    hideLogs: !!query.nologs,
  })

const queryFromState = (filters: EventFilters, layout: EventsLayout): Query => ({
  q: filters.search || undefined,
  type: clean(filters.types),
  topic: clean(filters.topics),
  severity: clean(filters.severities),
  status: clean(filters.statuses),
  project: clean(filters.projects),
  user: clean(filters.users),
  entity: filters.entity || undefined,
  range: filters.datePreset || undefined,
  from: filters.newerThan || undefined,
  to: filters.olderThan || undefined,
  nologs: filters.hideLogs || undefined,
  layout,
})

/**
 * Filters and layout are saved in the selected view. The url mirrors them so the address can be
 * shared: a link's filters are applied to the working view when the page opens, and a reload of
 * the same address changes nothing because it matches the view. The selected event is url only.
 */
export const useEventsViewState = () => {
  const [query, setQuery] = useQueryParams(PARAMS)
  const { isLoadingViews } = useViewsContext()

  const [savedFilters, saveFilters] = useViewsState<EventsViewSettings, 'filters'>(
    'filters',
    NO_FILTERS,
  )
  const [savedLayout, saveLayout] = useViewsState<EventsViewSettings, 'layout'>(
    'layout',
    DEFAULT_LAYOUT,
  )
  const filters = savedFilters ?? NO_FILTERS
  const layout = savedLayout ?? DEFAULT_LAYOUT

  const appliedLink = useRef(false)
  useEffect(() => {
    if (isLoadingViews || appliedLink.current) return
    appliedLink.current = true
    const linkFilters = filtersFromQuery(query)
    if (Object.keys(linkFilters).length && !isEqual(linkFilters, cleanFilters(filters))) {
      saveFilters(linkFilters)
    }
    if ((query.layout === 'table' || query.layout === 'timeline') && query.layout !== layout) {
      saveLayout(query.layout)
    }
    // only the address the page was opened with counts as a link
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingViews])

  const mirrored = useMemo(() => queryFromState(filters, layout), [filters, layout])
  useEffect(() => {
    if (appliedLink.current) setQuery(mirrored, 'replaceIn')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(mirrored), isLoadingViews])

  const setFilters = useCallback(
    (patch: Partial<EventFilters>) =>
      saveFilters((current) => cleanFilters({ ...current, ...patch })),
    [saveFilters],
  )
  const clearFilters = useCallback(() => saveFilters(NO_FILTERS), [saveFilters])

  const selectedId = query.event || null
  const setSelectedId = useCallback(
    (id: string | null) => setQuery({ event: id || undefined }, 'replaceIn'),
    [setQuery],
  )

  return {
    filters,
    setFilters,
    clearFilters,
    layout,
    setLayout: saveLayout as (layout: EventsLayout) => void,
    selectedId,
    setSelectedId,
    isLoadingViews,
  }
}

export const countActiveFilters = ({ olderThan, ...filters }: EventFilters) =>
  // a date range is one filter
  Object.values({ ...filters, range: filters.newerThan || olderThan, newerThan: undefined }).filter(
    (v) => (Array.isArray(v) ? v.length : !!v),
  ).length
