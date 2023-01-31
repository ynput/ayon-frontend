import React from 'react'
import { Section, TablePanel } from '@ynput/ayon-react-components'
import { TimestampField } from '/src/containers/fieldFormat'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

const EventList = ({ eventData, isLoading, selectedEvent, setSelectedEvent }) => {
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
