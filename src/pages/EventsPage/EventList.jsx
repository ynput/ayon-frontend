import React, { useRef } from 'react'
import { Section, TablePanel } from '@ynput/ayon-react-components'
import { TimestampField } from '@containers/fieldFormat'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { CellWithIcon } from '@components/icons'

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
  const statusObj = {
  'finished': "check",
  'aborted': "times",
  'failed': "error",
  'pending': "timer",
  'restarted': "history",
  }
  if (Object.keys(statusObj).includes(rowData.status)) {
    return <CellWithIcon iconStyle={{ marginRight: '0.2rem' }} icon={statusObj[rowData.status]} />
  }

  return <InlineSpinner />
}

const EventList = ({ eventData, isLoading, selectedEvent, setSelectedEvent, onScrollBottom }) => {
  const dataTableRef = useRef(null)

  const loadedLast = useRef(0)
  const handleLazy = (e) => {
    // only load new data if we have scrolled to the bottom
    if (loadedLast.current < e.last) {
      loadedLast.current = e.last

      onScrollBottom()
    }
  }

  return (
    <Section wrap>
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
          virtualScrollerOptions={{
            itemSize: 29,
            step: 99,
            lazy: true,
            onLazyLoad: handleLazy,
          }}
        >
          <Column style={{ maxWidth: 36, overflow: 'hidden' }} body={statusBodyTemplate} />
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
