import { useState } from 'react'
import { Section, Toolbar, InputText, InputSwitch } from '@ynput/ayon-react-components'
import usePubSub from '/src/hooks/usePubSub'
import { useGetEventsQuery } from '/src/services/events/getEvents'
import EventDetailDialog from './EventDetail'
import { useDispatch } from 'react-redux'
import { ayonApi } from '/src/services/ayon'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import EventList from './EventList'
import useSearchFilter from '/src/hooks/useSearchFilter'
import { toast } from 'react-toastify'
import { useLocalStorage } from '/src/utils'

const EventPage = () => {
  const dispatch = useDispatch()
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showLogs, setShowLogs] = useLocalStorage('events-logs', true)

  const last = 100
  const {
    data: eventData = [],
    isLoading,
    isError,
    error,
  } = useGetEventsQuery({ last, includeLogs: showLogs })

  const handlePubSub = (topic, message) => {
    if (topic === 'client.connected') {
      return
    }

    // patch the new message into the cache
    dispatch(
      ayonApi.util.updateQueryData('getEvents', { last }, (draft) => {
        let updated = false
        for (const row of draft) {
          if (row.id !== message.id) continue
          updated = true
          Object.assign(row, message)
        }

        !updated && draft.unshift(message)
      }),
    )
  }

  usePubSub('*', handlePubSub)

  const searchableFields = ['topic', 'user', 'project', 'description']
  // search filter
  const [search, setSearch, filteredData] = useSearchFilter(searchableFields, eventData)

  // handle error
  if (isError) {
    toast.error(error.message)
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
          Show Logs
        </Toolbar>
        <Splitter style={{ height: '100%', width: '100%' }}>
          <SplitterPanel size={70}>
            <EventList
              eventData={filteredData}
              isLoading={isLoading}
              selectedEvent={selectedEvent}
              setSelectedEvent={setSelectedEvent}
            />
          </SplitterPanel>
          <SplitterPanel size={30}>
            <EventDetailDialog
              id={selectedEvent?.id}
              setSelectedEvent={setSelectedEvent}
              setSearch={setSearch}
            />
          </SplitterPanel>
        </Splitter>
      </Section>
    </main>
  )
}

export default EventPage
