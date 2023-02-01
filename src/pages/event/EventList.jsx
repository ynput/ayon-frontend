import React, { useRef, useEffect } from 'react'
import { Section, TablePanel } from '@ynput/ayon-react-components'
import { TimestampField } from '/src/containers/fieldFormat'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

const EventList = ({ eventData, isLoading, selectedEvent, setSelectedEvent, onScrollBottom }) => {
  const dataTableRef = useRef(null)

  useEffect(() => {
    // table has the scrollable parent of the table
    const tableWrapper = dataTableRef.current.getElement().querySelector('.p-datatable-wrapper')

    let timeoutId = null
    let atBottom = false

    // Wrap the event listener function in a throttled function
    const throttledHandleScrollEvent = (e) => {
      if (timeoutId) {
        return
      }
      timeoutId = setTimeout(() => {
        timeoutId = null
      }, 100)

      const { scrollTop, scrollHeight, clientHeight } = e.target
      const scrollPosition = scrollTop + clientHeight

      const offset = 600
      // offset pixels from bottom
      if (scrollPosition >= scrollHeight - offset && !atBottom) {
        atBottom = true

        // log
        console.log('Reached bottom of table!')

        // fire on scroll bottom event
        onScrollBottom()
      } else if (scrollPosition < scrollHeight - offset) {
        atBottom = false
      }
    }

    // Assign the throttled function as the scroll event listener
    const tableScroll = tableWrapper.addEventListener('scroll', throttledHandleScrollEvent)

    return () => {
      // remove scroll event listener
      tableWrapper.removeEventListener('scroll', tableScroll)
    }
  }, [dataTableRef.current])

  return (
    <Section className={'wrap'}>
      <TablePanel loading={isLoading}>
        <DataTable
          value={eventData}
          scrollable="true"
          scrollHeight="flex"
          responsive="true"
          dataKey="id"
          selectionMode="single"
          onSelectionChange={(e) => setSelectedEvent(e.value.id)}
          selection={selectedEvent}
          rowClassName={(rowData) => {
            return {
              highlight: selectedEvent && selectedEvent.dependsOn === rowData.id,
              'row-error': rowData.topic === 'log.error',
              'row-warning': rowData.topic === 'log.warning',
              'row-success': rowData.topic === 'log.success',
            }
          }}
          ref={dataTableRef}
        >
          <Column
            header="Time"
            body={(row) => <TimestampField value={row.updatedAt} />}
            style={{ maxWidth: 180 }}
          />
          <Column header="Topic" field="topic" style={{ maxWidth: 200 }} />
          <Column header="Description" field="description" />
          <Column header="User" field="user" style={{ maxWidth: 120 }} />
          <Column header="Project" field="project" style={{ maxWidth: 150 }} />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default EventList
