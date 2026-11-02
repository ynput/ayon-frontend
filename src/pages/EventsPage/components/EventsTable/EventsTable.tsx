import { FC, useCallback, useMemo } from 'react'
import clsx from 'clsx'
import { format, formatDistanceToNowStrict, isToday } from 'date-fns'
import type { ColumnDef, ColumnSizingState } from '@tanstack/react-table'
import { Icon } from '@ynput/ayon-react-components'
import { ListTable } from '@shared/containers'
import { useLocalStorage } from '@shared/hooks'
import type { EventItem } from '../../types'
import {
  getCategory,
  getCategoryMeta,
  getSeverity,
  getSeverityMeta,
  getStatusMeta,
  isActiveStatus,
} from '../../utils/eventMeta'
import * as Styled from './EventsTable.styled'

// The description is last because ListTable gives the free space to the last column
const columns: ColumnDef<EventItem>[] = [
  {
    id: 'severity',
    header: '',
    size: 36,
    enableResizing: false,
    cell: ({ row }) => {
      const severity = getSeverityMeta(getSeverity(row.original))
      if (severity) return <Icon icon={severity.icon} style={{ color: severity.color }} />
      if (isActiveStatus(row.original.status))
        return <Icon icon="progress_activity" className="spin" />
      return null
    },
  },
  {
    id: 'createdAt',
    header: 'Time',
    size: 150,
    cell: ({ row }) => {
      const t = row.original.createdAt
      return (
        <span className="time" title={formatDistanceToNowStrict(t, { addSuffix: true })}>
          {isToday(t) ? format(t, 'HH:mm:ss') : format(t, 'dd MMM HH:mm:ss')}
        </span>
      )
    },
  },
  {
    id: 'topic',
    header: 'Topic',
    size: 220,
    cell: ({ row }) => {
      const meta = getCategoryMeta(getCategory(row.original.topic))
      return (
        <>
          <span className="dot" style={{ backgroundColor: meta.color }} />
          <span className="ellipsis">{row.original.topic}</span>
        </>
      )
    },
  },
  {
    id: 'project',
    header: 'Project',
    size: 140,
    cell: ({ row }) => <span className="ellipsis">{row.original.project}</span>,
  },
  {
    id: 'user',
    header: 'User',
    size: 120,
    cell: ({ row }) => <span className="ellipsis">{row.original.user}</span>,
  },
  {
    id: 'status',
    header: 'Status',
    size: 110,
    cell: ({ row }) => {
      const status = getStatusMeta(row.original.status)
      return (
        <span className={clsx('status', row.original.status)}>
          <Icon icon={status.icon} />
          {status.label}
        </span>
      )
    },
  },
  {
    id: 'description',
    header: 'Description',
    size: 200,
    cell: ({ row }) => (
      <span className="ellipsis" title={row.original.description}>
        {row.original.description}
      </span>
    ),
  },
]

// ListTable hides columns that have no default
const defaultColumnVisibility = Object.fromEntries(columns.map((c) => [c.id as string, true]))

const getRowId = (event: EventItem) => event.id

const getRowClassName = (event: EventItem) => {
  const severity = getSeverity(event)
  return severity ? `severity-${severity}` : undefined
}

// events are read only
const noUpdate = () => {}

export interface EventsTableProps {
  events: EventItem[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

export const EventsTable: FC<EventsTableProps> = ({
  events,
  selectedId,
  onSelect,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}) => {
  const [columnSizing, setColumnSizing] = useLocalStorage<ColumnSizingState>(
    'events-table-column-sizing',
    {},
  )

  const selectedRows = useMemo(() => (selectedId ? [selectedId] : []), [selectedId])
  const handleSelectedRowsChange = useCallback(
    (ids: string[]) => onSelect(ids[0] ?? null),
    [onSelect],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && selectedId) {
      e.preventDefault()
      onSelect(null)
    }
  }

  return (
    <Styled.Wrapper onKeyDown={handleKeyDown}>
      <ListTable
        variant="data"
        data={events}
        columns={columns}
        defaultColumnVisibility={defaultColumnVisibility}
        getRowId={getRowId}
        getRowClassName={getRowClassName}
        editable={false}
        onUpdateRow={noUpdate}
        cellWrapper={null}
        enableExpanding={false}
        enableColumnResizing
        columnSizing={columnSizing}
        onColumnSizingChange={setColumnSizing}
        selectedRows={selectedRows}
        onSelectedRowsChange={handleSelectedRowsChange}
        scrollToSelection
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    </Styled.Wrapper>
  )
}
