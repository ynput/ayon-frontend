import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { Button, Icon } from '@ynput/ayon-react-components'
import { EmptyPlaceholder } from '@shared/components/EmptyPlaceholder'
import { useLocalStorage } from '@shared/hooks'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import { ViewsProvider } from '@shared/containers'
import { useAppDispatch } from '@state/store'
import { useEventsViewState, countActiveFilters } from './hooks/useEventsViewState'
import { useEventsData } from './hooks/useEventsData'
import { EventsFilters } from './components/EventsFilters/EventsFilters'
import { EventsSearchFilter } from './components/EventsSearchFilter/EventsSearchFilter'
import { EventsViews } from './components/EventsViews'
import { EVENTS_VIEW_TYPE } from './constants'
import {
  EventsTimeline,
  INITIAL_TIMELINE_VIEW,
  TimelineViewState,
} from './components/EventsTimeline/EventsTimeline'
import { EventsTable } from './components/EventsTable/EventsTable'
import { EventDetails } from './components/EventDetails/EventDetails'
import * as Styled from './EventsPage.styled'

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])
  return matches
}

const LAYOUTS = [
  { id: 'table', label: 'Table', icon: 'table_rows' },
  { id: 'timeline', label: 'Timeline', icon: 'timeline' },
] as const

const EventsPageContent = () => {
  const {
    filters,
    setFilters,
    clearFilters,
    layout,
    setLayout,
    selectedId,
    setSelectedId,
    isLoadingViews,
  } = useEventsViewState()
  const {
    resolvedFilters,
    events,
    isLoading: isLoadingEvents,
    isStale,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useEventsData(filters, isLoadingViews)
  const isLoading = isLoadingViews || isLoadingEvents

  const isNarrow = useMediaQuery('(max-width: 1100px)')
  const [filtersOpenPref, setFiltersOpen] = useLocalStorage('events-filters-open', true)
  // on narrow screens the panel is an overlay and starts closed
  const [narrowFiltersOpen, setNarrowFiltersOpen] = useState(false)
  const filtersOpen = isNarrow ? narrowFiltersOpen : filtersOpenPref
  const toggleFilters = () =>
    isNarrow ? setNarrowFiltersOpen((o) => !o) : setFiltersOpen(!filtersOpenPref)

  // lives here so switching views or opening details never resets the timeline position
  const [timelineView, setTimelineView] = useState<TimelineViewState>(INITIAL_TIMELINE_VIEW)
  const updateTimelineView = useCallback(
    (updater: (v: TimelineViewState) => TimelineViewState) => setTimelineView(updater),
    [],
  )

  // another entity (from a filter or a view) is a different set of events, refit once it loads
  const timelineEntity = useRef(filters.entity)
  useEffect(() => {
    if (timelineEntity.current === filters.entity) return
    timelineEntity.current = filters.entity
    setTimelineView((v) => ({ ...v, initialised: false }))
  }, [filters.entity])

  const selectedIndex = useMemo(
    () => (selectedId ? events.findIndex((e) => e.id === selectedId) : -1),
    [events, selectedId],
  )
  const selectedEvent = selectedIndex >= 0 ? events[selectedIndex] : undefined

  const entityLabel = useMemo(() => {
    if (!filters.entity) return undefined
    const match = events.find((e) => e.summary.entityId === filters.entity)
    return match?.summary.entityPath as string | undefined
  }, [events, filters.entity])

  const activeCount = countActiveFilters(filters)
  const isEmpty = !isLoading && !error && events.length === 0

  let content
  if (error && !events.length) {
    content = <EmptyPlaceholder error={error} ynputError={false} />
  } else if (isLoading) {
    content = (
      <Styled.Loading role="status">
        <Icon icon="progress_activity" className="spin" />
        Loading events…
      </Styled.Loading>
    )
  } else if (isEmpty) {
    content = (
      <EmptyPlaceholder
        icon="event_busy"
        message={activeCount ? 'No events match these filters' : 'No events yet'}
      >
        {activeCount > 0 && (
          <Button
            icon="filter_alt_off"
            label="Clear filters"
            variant="filled"
            onClick={clearFilters}
          />
        )}
      </EmptyPlaceholder>
    )
  } else if (layout === 'timeline') {
    content = (
      <EventsTimeline
        events={events}
        selectedId={selectedId}
        onSelect={setSelectedId}
        view={timelineView}
        onViewChange={updateTimelineView}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        newerThan={
          resolvedFilters.newerThan ? new Date(resolvedFilters.newerThan).getTime() : undefined
        }
        olderThan={
          resolvedFilters.olderThan ? new Date(resolvedFilters.olderThan).getTime() : undefined
        }
      />
    )
  } else {
    content = (
      <EventsTable
        events={events}
        selectedId={selectedId}
        onSelect={setSelectedId}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    )
  }

  return (
    <>
      <DocumentTitle title="Events • AYON" />
      <Styled.Page className={clsx({ narrow: isNarrow })}>
        {filtersOpen && (
          <Styled.FiltersColumn>
            <EventsFilters
              filters={filters}
              onChange={setFilters}
              onClear={clearFilters}
              events={events}
              entityLabel={entityLabel}
            />
          </Styled.FiltersColumn>
        )}
        {isNarrow && filtersOpen && <Styled.Scrim onClick={() => setNarrowFiltersOpen(false)} />}

        <Styled.MainColumn>
          <Styled.Toolbar>
            <Button
              icon={filtersOpen ? 'left_panel_close' : 'filter_list'}
              variant="text"
              onClick={toggleFilters}
              aria-expanded={filtersOpen}
              aria-label={filtersOpen ? 'Hide filters' : 'Show filters'}
              data-tooltip={filtersOpen ? 'Hide filters' : 'Show filters'}
            >
              {!filtersOpen && activeCount > 0 && <Styled.Badge>{activeCount}</Styled.Badge>}
            </Button>
            <EventsViews />
            <EventsSearchFilter
              filters={filters}
              onChange={setFilters}
              events={events}
              entityLabel={entityLabel}
            />
            <Styled.Status role="status">
              {(isStale || isFetchingNextPage) && (
                <Icon icon="progress_activity" className="spin" />
              )}
              {!isLoading && (
                <span>
                  {events.length.toLocaleString()}
                  {hasNextPage ? '+' : ''} events
                </span>
              )}
            </Styled.Status>
            <Styled.LayoutSwitch role="group" aria-label="Layout">
              {LAYOUTS.map(({ id, label, icon }) => (
                <Button
                  key={id}
                  icon={icon}
                  label={label}
                  variant="text"
                  selected={layout === id}
                  aria-pressed={layout === id}
                  onClick={() => setLayout(id)}
                />
              ))}
            </Styled.LayoutSwitch>
          </Styled.Toolbar>
          <Styled.Content className={clsx({ stale: isStale })}>{content}</Styled.Content>
        </Styled.MainColumn>

        {selectedId && (
          <Styled.DetailsColumn>
            <EventDetails
              key={selectedId}
              eventId={selectedId}
              listEvent={selectedEvent}
              olderId={selectedIndex >= 0 ? events[selectedIndex + 1]?.id : undefined}
              newerId={selectedIndex > 0 ? events[selectedIndex - 1]?.id : undefined}
              onSelect={setSelectedId}
              onFilter={setFilters}
            />
          </Styled.DetailsColumn>
        )}
      </Styled.Page>
    </>
  )
}

const EventsPage = () => {
  const dispatch = useAppDispatch()
  return (
    <ViewsProvider viewType={EVENTS_VIEW_TYPE} dispatch={dispatch}>
      <EventsPageContent />
    </ViewsProvider>
  )
}

export default EventsPage
