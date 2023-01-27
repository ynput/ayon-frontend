import { useState } from 'react'
import { Section } from '@ynput/ayon-react-components'
import usePubSub from '/src/hooks/usePubSub'
import { useGetEventsQuery } from '/src/services/events/getEvents'
import EventDetailDialog from './EventDetail'
import { useDispatch } from 'react-redux'
import { ayonApi } from '/src/services/ayon'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import EventList from './EventList'

const EventPage = () => {
  const dispatch = useDispatch()
  const [selectedEvent, setSelectedEvent] = useState(null)

  const last = 100
  const { data: eventData, isLoading, isError, error } = useGetEventsQuery({ last })

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

  // handle error
  if (isError) {
    return <div>Error: {error.message}</div>
  }

  return (
    <main>
      <Section>
        <Splitter style={{ height: '100%', width: '100%' }}>
          <SplitterPanel size={70}>
            <EventList
              eventData={eventData}
              isLoading={isLoading}
              selectedEvent={selectedEvent}
              setSelectedEvent={setSelectedEvent}
            />
          </SplitterPanel>
          <SplitterPanel size={30}>
            <EventDetailDialog id={selectedEvent?.id} />
          </SplitterPanel>
        </Splitter>
      </Section>
    </main>
  )
}

export default EventPage
