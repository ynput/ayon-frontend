import { useState } from 'react'
import { Section, Toolbar, TablePanel } from '@ynput/ayon-react-components'
import { TimestampField } from '/src/containers/fieldFormat'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import usePubSub from '/src/hooks/usePubSub'
import { useGetEventsQuery } from '/src/services/events/getEvents'
import EventDetailDialog from './EventDetail'
import { useDispatch } from 'react-redux'
import { ayonApi } from '/src/services/ayon'

const EventPage = () => {
  const dispatch = useDispatch()
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [detailVisible, setDetailVisible] = useState(false)

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

  const formatTime = (rowData) => {
    return <TimestampField value={rowData.updatedAt} />
  }

  const onRowClick = (e) => {
    if (e.originalEvent.detail === 2) {
      setDetailVisible(true)
    }
  }

  // handle error
  if (isError) {
    return <div>Error: {error.message}</div>
  }

  return (
    <main>
      {detailVisible && (
        <EventDetailDialog onHide={() => setDetailVisible(false)} id={selectedEvent?.id} />
      )}
      <Section>
        <Toolbar></Toolbar>
        <TablePanel loading={isLoading}>
          <DataTable
            value={eventData}
            scrollable="true"
            scrollHeight="flex"
            responsive="true"
            dataKey="id"
            selectionMode="single"
            onSelectionChange={(e) => setSelectedEvent(e.value)}
            selection={selectedEvent}
            onRowClick={onRowClick}
            rowClassName={(rowData) => {
              return {
                highlight: selectedEvent && selectedEvent.dependsOn === rowData.id,
                'row-error': rowData.topic === 'log.error',
                'row-warning': rowData.topic === 'log.warning',
                'row-success': rowData.topic === 'log.success',
              }
            }}
          >
            <Column header="Time" body={formatTime} style={{ maxWidth: 180 }} />
            <Column header="Topic" field="topic" style={{ maxWidth: 200 }} />
            <Column header="Description" field="description" />
            <Column header="User" field="user" style={{ maxWidth: 120 }} />
            <Column header="Project" field="project" style={{ maxWidth: 150 }} />
          </DataTable>
        </TablePanel>
      </Section>
    </main>
  )
}

export default EventPage
