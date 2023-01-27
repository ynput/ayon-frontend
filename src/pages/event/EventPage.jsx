import { useState, useEffect } from 'react'
import { Section, Toolbar, TablePanel } from '@ynput/ayon-react-components'
import { TimestampField } from '/src/containers/fieldFormat'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import usePubSub from '/src/hooks/usePubSub'
import { useGetAllEventsQuery } from '/src/services/events/getEvents'
import EventDetailDialog from './EventDetail'

const EventPage = () => {
  const [eventData, setEventData] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [detailVisible, setDetailVisible] = useState(false)

  const { data, isLoading, isError, error } = useGetAllEventsQuery({ last: 100 })

  // set event data to queried data
  useEffect(() => {
    if (data && !isError && !isLoading) {
      setEventData(data)
    }
  }, [data, isLoading])

  const handlePubSub = (topic, message) => {
    if (topic === 'client.connected') {
      return
    }
    setEventData((ed) => {
      let updated = false
      for (const row of ed) {
        if (row.id !== message.id) continue
        updated = true
        Object.assign(row, message)
      }
      if (!updated) return [message, ...ed]
      return [...ed]
    })
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
