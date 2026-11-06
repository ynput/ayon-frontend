import React, { useRef } from 'react'
import { Icon, Section, TablePanel } from '@ynput/ayon-react-components'
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
  border: 2px solid light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.3));
  border-top-color: light-dark(var(--md-sys-color-on-surface), #fff);
  animation: ${spin} 0.8s linear infinite;
`

const LOG_ICONS = {
  'log.error': { icon: 'error', color: 'var(--md-sys-color-error)' },
  'log.warning': { icon: 'warning', color: 'var(--md-sys-color-warning)' },
  'log.info': { icon: 'info', color: 'var(--md-sys-color-on-surface-variant)' },
  'log.success': { icon: 'check_circle', color: 'var(--md-sys-color-tertiary)' },
}

const statusBodyTemplate = (rowData) => {
  const statusObj = {
    finished: 'check',
    aborted: 'times',
    failed: 'error',
    pending: 'timer',
    restarted: 'history',
  }
  // log events all finish instantly, so show their level instead of the status
  const logIcon = LOG_ICONS[rowData.topic]
  if (logIcon) {
    return (
      <Icon
        icon={logIcon.icon}
        style={{ color: logIcon.color, fontSize: 18, verticalAlign: 'middle' }}
        data-tooltip={rowData.topic}
      />
    )
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
          className="standard-rows"
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
          // fixed layout: a long description must not push User and Project out of view
          tableStyle={{ tableLayout: 'fixed', width: '100%' }}
          virtualScrollerOptions={{
            // the row height of .standard-rows (--size-row)
            itemSize: 34,
            step: 99,
            lazy: true,
            onLazyLoad: handleLazy,
          }}
        >
          <Column style={{ width: 36, overflow: 'hidden' }} body={statusBodyTemplate} />
          <Column
            header="Time"
            body={(row) => <TimestampField value={row?.updatedAt} />}
            style={{ width: 180 }}
          />
          <Column header="Topic" field="topic" style={{ width: 240, textOverflow: 'ellipsis' }} />
          <Column header="Description" field="description" style={{ textOverflow: 'ellipsis' }} />
          <Column header="User" field="user" style={{ width: 120, textOverflow: 'ellipsis' }} />
          <Column
            header="Project"
            field="project"
            style={{ width: 120, textOverflow: 'ellipsis' }}
          />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default EventList
