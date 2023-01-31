import { useState } from 'react'
import { Section, Toolbar, InputText, InputSwitch } from '@ynput/ayon-react-components'
import usePubSub from '/src/hooks/usePubSub'
import { useGetEventsWithLogsQuery } from '/src/services/events/getEvents'
import EventDetail from './EventDetail'
import { useDispatch } from 'react-redux'
import { ayonApi } from '/src/services/ayon'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import EventList from './EventList'
import useSearchFilter from '/src/hooks/useSearchFilter'
import { toast } from 'react-toastify'
import { useLocalStorage } from '/src/utils'
import EventOverview from './EventOverview'

const EventPage = () => {
  const dispatch = useDispatch()
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showLogs, setShowLogs] = useLocalStorage('events-logs', true)

  const last = 100
  const { data, isLoading, isError, error } = useGetEventsWithLogsQuery({ last })
  let { events: eventData = [], logs: logsData = [] } = data || {}

  // use log data if showLogs is true
  let treeData = eventData
  if (showLogs) {
    treeData = logsData
  }

  const handlePubSub = (topic, message) => {
    if (topic === 'client.connected') {
      return
    }

    // patch the new message into the cache
    dispatch(
      ayonApi.util.updateQueryData('getEventsWithLogs', { last }, (draft) => {
        const patchEvents = (type, message) => {
          let updated = false
          for (const row of draft[type]) {
            if (row.id !== message.id) continue
            // update existing row
            updated = true
            Object.assign(row, message)
          }

          !updated && draft[type].unshift(message)
        }

        if (!topic.startsWith('log.')) {
          // patch only non log messages
          patchEvents('events', message)
        }

        // patch all into logs

        patchEvents('logs', message)
      }),
    )
  }

  usePubSub('*', handlePubSub)

  const searchableFields = ['topic', 'user', 'project', 'description']
  // search filter
  const [search, setSearch, filteredTreeData] = useSearchFilter(searchableFields, treeData)

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

export default EventPage
