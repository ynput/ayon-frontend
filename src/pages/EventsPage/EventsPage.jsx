import { Section, Toolbar, InputText, InputSwitch } from '@ynput/ayon-react-components'
import { useGetEventsWithLogsQuery } from '/src/services/events/getEvents'
import EventDetail from './EventDetail'
import { useDispatch } from 'react-redux'
import { ayonApi } from '/src/services/ayon'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import EventList from './EventList'
import useSearchFilter from '/src/hooks/useSearchFilter'
import { toast } from 'react-toastify'
import useLocalStorage from '/src/hooks/useLocalStorage'
import EventOverview from './EventOverview'
import { StringParam, useQueryParam } from 'use-query-params'
import { useMemo } from 'react'
import { useEffect } from 'react'

const EventsPage = () => {
  const dispatch = useDispatch()
  const [showLogs, setShowLogs] = useLocalStorage('events-logs', true)
  // use query param to get selected event
  let [selectedEventId, setSelectedEvent] = useQueryParam('event', StringParam)

  // default gets the last 100 events
  const { data, isLoading, isError, error, refetch } = useGetEventsWithLogsQuery({}, {})
  let { events: eventData = [], logs: logsData = [], hasPreviousPage } = data || {}

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

  const patchOldEvents = (type, events, draft) => {
    for (const message of events) {
      draft[type].push(message)
    }
  }

  const loadPage = async () => {
    try {
      // no more events to get
      if (!hasPreviousPage) return console.log('no more events data to get')
      // get last cursor
      const before = eventData[eventData.length - 1].cursor
      const beforeLogs = logsData[logsData.length - 1].cursor

      // get new events data
      const { data } = await dispatch(
        ayonApi.endpoints.getEventsWithLogs.initiate({
          before,
          beforeLogs,
        }),
      )

      dispatch(
        ayonApi.util.updateQueryData('getEventsWithLogs', {}, (draft) => {
          patchOldEvents('events', data.events, draft)
          patchOldEvents('logs', data.logs, draft)
          draft.hasPreviousPage = data.hasPreviousPage
        }),
      )
    } catch (error) {
      console.log(error)
    }
  }

  const searchableFields = ['topic', 'user', 'project', 'description']
  // search filter
  const [search, setSearch, filteredTreeData] = useSearchFilter(
    searchableFields,
    treeData,
    'events',
  )

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
          <InputText
            style={{ width: '200px' }}
            placeholder="Filter events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autocomplete="off"
          />
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
              isLoading={isLoading}
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
