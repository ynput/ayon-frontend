import React, { useRef, useEffect } from 'react'
import { Section, TablePanel } from '@ynput/ayon-react-components'
import { TimestampField } from '/src/containers/fieldFormat'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { CellWithIcon } from '/src/components/icons'

import styled, { keyframes } from 'styled-components'

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`

const InlineSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  animation: ${spin} 0.8s linear infinite;
`

const statusBodyTemplate = (rowData) => {
  if (rowData.status === 'finished') return <CellWithIcon icon="check" />
  if (rowData.status === 'aborted') return <CellWithIcon icon="times" />
  if (rowData.status === 'failed') return <CellWithIcon icon="error" />
  if (rowData.status === 'in_progress') return <InlineSpinner />
  if (rowData.status === 'pending') return <CellWithIcon icon="timer" />
  if (rowData.status === 'restarted') return <CellWithIcon icon="history" />
}

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

        // fire on scroll bottom event
        onScrollBottom()
      } else if (scrollPosition < scrollHeight - offset) {
        atBottom = false
      }
    }

    // Assign the throttled function as the scroll event listener
    tableWrapper.addEventListener('scroll', throttledHandleScrollEvent)

    return () => {
      // remove scroll event listener
      tableWrapper.removeEventListener('scroll', throttledHandleScrollEvent)
    }
  }, [dataTableRef.current, onScrollBottom, eventData])

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
          <Column style={{ maxWidth: 30 }} body={statusBodyTemplate} />
          <Column
            header="Time"
            body={(row) => <TimestampField value={row?.updatedAt} />}
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
