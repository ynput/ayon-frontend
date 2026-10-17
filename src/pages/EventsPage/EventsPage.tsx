import { useCallback, useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Button, Icon } from '@ynput/ayon-react-components'
import { EmptyPlaceholder } from '@shared/components/EmptyPlaceholder'
import { useLocalStorage } from '@shared/hooks'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import { useEventsUrlState, countActiveFilters } from './hooks/useEventsUrlState'
import { useEventsData } from './hooks/useEventsData'
import { EventsFilters } from './components/EventsFilters/EventsFilters'
import { ActiveFilters } from './components/ActiveFilters'
import {
  EventsTimeline,
  INITIAL_TIMELINE_VIEW,
  TimelineViewState,
} from './components/EventsTimeline/EventsTimeline'
import { EventsTable } from './components/EventsTable/EventsTable'
import { EventDetails } from './components/EventDetails/EventDetails'
import type { EventFilters } from './types'
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

const EventsPage = () => {
  const { filters, setFilters, clearFilters, view, setView, selectedId, setSelectedId } =
    useEventsUrlState()
  const { events, isLoading, isStale, isFetchingNextPage, hasNextPage, fetchNextPage, error } =
    useEventsData(filters)

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

  const handleFilter = useCallback(
    (patch: Partial<EventFilters>) => {
      setFilters(patch)
      // a new filter shows a different set of events, refit the timeline once it loads
      if ('entity' in patch) setTimelineView((v) => ({ ...v, initialised: false }))
    },
    [setFilters],
  )

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
  } else if (view === 'timeline') {
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
        newerThan={filters.newerThan ? new Date(filters.newerThan).getTime() : undefined}
        olderThan={filters.olderThan ? new Date(filters.olderThan).getTime() : undefined}
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
              onChange={handleFilter}
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
            <Styled.ViewSwitch role="tablist" aria-label="View">
              <button
                role="tab"
                aria-selected={view === 'timeline'}
                className={clsx({ active: view === 'timeline' })}
                onClick={() => setView('timeline')}
              >
                <Icon icon="timeline" /> Timeline
              </button>
              <button
                role="tab"
                aria-selected={view === 'table'}
                className={clsx({ active: view === 'table' })}
                onClick={() => setView('table')}
              >
                <Icon icon="table_rows" /> Table
              </button>
            </Styled.ViewSwitch>
            <ActiveFilters filters={filters} entityLabel={entityLabel} onChange={handleFilter} />
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
              onFilter={handleFilter}
            />
          </Styled.DetailsColumn>
        )}
      </Styled.Page>
    </>
  )
}

export default EventsPage
