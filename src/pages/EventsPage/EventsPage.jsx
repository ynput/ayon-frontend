import { Section, Toolbar, InputText, InputSwitch } from '@ynput/ayon-react-components'
import { useGetEventsWithLogsQuery, useLazyGetEventsWithLogsQuery } from '@queries/events/getEvents'
import EventDetail from './EventDetail'
import { useDispatch } from 'react-redux'
import api from '@shared/api'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import EventList from './EventList'
import useSearchFilter from '@hooks/useSearchFilter'
import { toast } from 'react-toastify'
import { useLocalStorage } from '@shared/hooks'
import EventOverview from './EventOverview'
import { useMemo, useRef, useState } from 'react'
import { useEffect } from 'react'
import { debounce } from 'lodash'

const EventsPage = () => {
  
  const dispatch = useDispatch()
  const [showLogs, setShowLogs] = useLocalStorage('events-logs', true)
  // use query param to get selected event
  //let [selectedEventId, setSelectedEvent] = useQueryParam('event', StringParam)
  let [selectedEventId, setSelectedEvent] = useState()

  const [loadMoreEvents, { isFetching }] = useLazyGetEventsWithLogsQuery()
  // default gets the last 100 events
  const { data, isLoading, isError, error, refetch } = useGetEventsWithLogsQuery({}, {})
  let { events: eventData = [], logs: logsData = [], hasPreviousPage } = data || {}

  const [pagination, setPagination] = useState({})
  const [searchPagination, setSearchPagination] = useState({})
  const [searched, setSearched] = useState('')

  // always refetch with new date to force new data onMount
  useEffect(() => {
    refetch(new Date().toDateString())
  }, [])

  // create a object of events by id useMemo
  const eventsById = useMemo(() => {
    const events = {}
    for (const event of eventData) {
      events[event.id] = event
    }
    for (const event of logsData) {
      // skip if already exists
      if (events[event.id]) continue
      events[event.id] = event
    }
    return events
  }, [eventData])

  // get selected event by id
  const selectedEvent = eventsById[selectedEventId]

  // use log data if showLogs is true
  let treeData = eventData
  if (showLogs) {
    treeData = logsData
  }

  // sort treeData by updatedAt
  treeData = useMemo(() => {
    return [...treeData].sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
  }, [treeData])

  const patchOldEvents = (type, events, draft) => {
    // loop through events and add to draft if not already exists
    // if already exists, replace it
    for (const message of events) {
      const index = draft[type].findIndex((e) => e.id === message.id)
      if (index === -1) {
        draft[type].push(message)
      } else {
        draft[type][index] = message
      }
    }

    // for (const message of events) {
    //   draft[type].push(message)
    // }
  }

  const searchableFields = ['topic', 'user', 'project', 'description']
  // search filter
  const [search, setSearch, filteredTreeData] = useSearchFilter(
    searchableFields,
    treeData,
    'events',
  )

  useEffect(() => {
    // on first load, set pagination for _default
    if (isLoading) return
    setPagination({
      hasPreviousPage,
      before: eventData[eventData.length - 1]?.cursor,
      after: eventData[0]?.cursor,
    })
  }, [isLoading])

  const loadPage = async () => {
    try {
      // use pagination or search pagination if searching
      const { before, beforeLogs, hasPreviousPage } = search ? searchPagination : pagination || {}
      // no more events to get
      if (!hasPreviousPage) return console.log('no more events data to get')

      const data = await loadMoreEvents({
        before,
        beforeLogs,
        last: 100,
        filter: search,
      }).unwrap()

      if (search) {
        setSearchPagination({
          hasPreviousPage: data.hasPreviousPage,
          before: data.events[data.events.length - 1]?.cursor,
          beforeLogs: data.logs[data.logs.length - 1]?.cursor,
        })
      } else {
        // update pagination
        setPagination({
          hasPreviousPage: data.hasPreviousPage,
          before: data.events[data.events.length - 1]?.cursor,
          beforeLogs: data.logs[data.logs.length - 1]?.cursor,
        })
      }

      dispatch(
        api.util.updateQueryData('getEventsWithLogs', {}, (draft) => {
          patchOldEvents('events', data.events, draft, false)
          patchOldEvents('logs', data.logs, draft, false)
          draft.hasPreviousPage = data.hasPreviousPage
        }),
      )
    } catch (error) {
      console.log(error)
    }
  }

  const loadSearch = async (newSearch, oldSearch) => {
    if (newSearch === oldSearch) return console.log('same search')

    try {
      setSearched(search)
      const data = await loadMoreEvents({
        filter: newSearch,
        last: 100,
      }).unwrap()

      // set new search pagination
      setSearchPagination({
        hasPreviousPage: data.hasPreviousPage,
        before: data.events[data.events.length - 1]?.cursor,
        beforeLogs: data.logs[data.logs.length - 1]?.cursor,
      })

      dispatch(
        api.util.updateQueryData('getEventsWithLogs', {}, (draft) => {
          patchOldEvents('events', data.events, draft, true)
          patchOldEvents('logs', data.logs, draft, true)
          draft.hasPreviousPage = data.hasPreviousPage
        }),
      )
    } catch (error) {
      console.log(error)
      setSearched('')
    }
  }

  const throttledSearchLoad = useRef(
    debounce((newSearch, oldSearch) => loadSearch(newSearch, oldSearch), 1200),
  )

  useEffect(() => {
    if (search && !isLoading) {
      // throttled load page
      throttledSearchLoad.current(search, searched)
    }
  }, [search, isLoading, searched])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (search) {
      loadSearch(search, searched)
    }
  }

  // handle error
  if (isError) {
    toast.error(error.message)
  }

  const handleSearchFilter = (s) => {
    if (search === s) {
      setSearch('')
      return
    }

    if (s === 'error') setShowLogs(true)
    else setShowLogs(false)

    setSearch(s)
  }

  return (
    <main>
      <Section>
        <Toolbar>
          <form onSubmit={handleSearchSubmit}>
            <InputText
              style={{ width: '200px' }}
              placeholder="Filter events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </form>
          <InputSwitch
            checked={showLogs}
            onChange={() => setShowLogs(!showLogs)}
            style={{ width: 40, marginLeft: 10 }}
          />
          Show With Logs
        </Toolbar>
        <Splitter style={{ height: '100%', width: '100%' }}>
          <SplitterPanel size={70}>
            <EventList
              eventData={filteredTreeData}
              isLoading={isLoading || isFetching}
              selectedEvent={selectedEvent}
              setSelectedEvent={setSelectedEvent}
              onScrollBottom={loadPage}
            />
          </SplitterPanel>
          <SplitterPanel size={30}>
            {selectedEvent?.id ? (
              <EventDetail
                id={selectedEvent?.id}
                event={selectedEvent}
                setSelectedEvent={setSelectedEvent}
                onFilter={handleSearchFilter}
                events={eventData}
              />
            ) : (
              <EventOverview
                onTotal={handleSearchFilter}
                search={search}
                events={eventData}
                logs={logsData}
                setShowLogs={setShowLogs}
                setSelectedEvent={setSelectedEvent}
              />
            )}
          </SplitterPanel>
        </Splitter>
      </Section>
    </main>
  )
}

export default EventsPage
