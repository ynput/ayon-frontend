import { FC, memo, useEffect, useMemo, useRef } from 'react'
import clsx from 'clsx'
import { format, formatDistanceToNowStrict, isToday } from 'date-fns'
import {
  ColumnDef,
  ColumnSizingState,
  flexRender,
  getCoreRowModel,
  Row,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Icon } from '@ynput/ayon-react-components'
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

const ROW_HEIGHT = 32

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
    id: 'description',
    header: 'Description',
    size: 480,
    cell: ({ row }) => (
      <span className="ellipsis" title={row.original.description}>
        {row.original.description}
      </span>
    ),
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
]

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [columnSizing, setColumnSizing] = useLocalStorage<ColumnSizingState>(
    'events-table-column-sizing',
    {},
  )

  const table = useReactTable({
    data: events,
    columns,
    getRowId: (row) => row.id,
    state: { columnSizing },
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    // required by the app wide table typings, events are read only and unfiltered
    filterFns: { fuzzy: () => true },
    meta: { updateData: () => {} },
  })

  const { rows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: rows.length + (hasNextPage ? 1 : 0),
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  })
  const virtualRows = virtualizer.getVirtualItems()

  // load the next page once the loader row scrolls into view
  const lastIndex = virtualRows[virtualRows.length - 1]?.index ?? 0
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && lastIndex >= rows.length - 1) fetchNextPage()
  }, [lastIndex, rows.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  const selectedIndex = useMemo(
    () => (selectedId ? rows.findIndex((r) => r.id === selectedId) : -1),
    [rows, selectedId],
  )

  // keep the selection in view when it changes from the timeline or keyboard
  useEffect(() => {
    if (selectedIndex >= 0) virtualizer.scrollToIndex(selectedIndex, { align: 'auto' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowDown: 1, ArrowUp: -1, PageDown: 15, PageUp: -15 }[e.key]
    if (step) {
      e.preventDefault()
      const next = Math.min(
        rows.length - 1,
        Math.max(0, (selectedIndex === -1 ? -1 : selectedIndex) + step),
      )
      if (rows[next]) onSelect(rows[next].id)
      return
    }
    if (e.key === 'Home' && rows[0]) {
      e.preventDefault()
      onSelect(rows[0].id)
    }
    if (e.key === 'Escape' && selectedId) {
      e.preventDefault()
      onSelect(null)
    }
  }

  // column widths as css variables so resizing doesn't re-render every row
  const headers = table.getFlatHeaders()
  const sizeVars = useMemo(() => {
    const vars: Record<string, string> = {}
    for (const header of headers) vars[`--col-${header.column.id}`] = `${header.getSize()}px`
    return vars
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().columnSizing, headers])

  // description absorbs the free space and may shrink, the other columns keep their width
  const totalWidth = table.getTotalSize() - (table.getColumn('description')?.getSize() ?? 0) + 200

  return (
    <Styled.Scroll
      ref={scrollRef}
      tabIndex={0}
      role="grid"
      aria-label="Events"
      aria-rowcount={hasNextPage ? -1 : rows.length}
      aria-activedescendant={selectedId ? `event-row-${selectedId}` : undefined}
      onKeyDown={handleKeyDown}
      style={sizeVars as React.CSSProperties}
    >
      <Styled.Header role="row" style={{ minWidth: totalWidth }}>
        {headers.map((header) => (
          <Styled.HeaderCell
            key={header.id}
            role="columnheader"
            className={clsx({ grow: header.column.id === 'description' })}
            style={{ width: `var(--col-${header.column.id})` }}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
            {header.column.getCanResize() && (
              <Styled.Resizer
                onMouseDown={header.getResizeHandler()}
                onTouchStart={header.getResizeHandler()}
                onDoubleClick={() => header.column.resetSize()}
                className={clsx({ resizing: header.column.getIsResizing() })}
                aria-hidden
              />
            )}
          </Styled.HeaderCell>
        ))}
      </Styled.Header>
      <Styled.Body style={{ height: virtualizer.getTotalSize(), minWidth: totalWidth }}>
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index]
          if (!row) {
            return (
              <Styled.LoaderRow
                key="loader"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <Icon icon="progress_activity" className="spin" /> Loading older events…
              </Styled.LoaderRow>
            )
          }
          return (
            <EventRow
              key={row.id}
              row={row}
              start={virtualRow.start}
              isSelected={row.id === selectedId}
              onSelect={onSelect}
            />
          )
        })}
      </Styled.Body>
    </Styled.Scroll>
  )
}

type EventRowProps = {
  row: Row<EventItem>
  start: number
  isSelected: boolean
  onSelect: (id: string) => void
}

const EventRow = memo(({ row, start, isSelected, onSelect }: EventRowProps) => {
  const severity = getSeverity(row.original)
  return (
    <Styled.BodyRow
      id={`event-row-${row.id}`}
      role="row"
      aria-selected={isSelected}
      className={clsx(severity && `severity-${severity}`, { selected: isSelected })}
      style={{ transform: `translateY(${start}px)` }}
      onClick={() => onSelect(row.id)}
    >
      {row.getVisibleCells().map((cell) => (
        <Styled.Cell
          key={cell.id}
          role="gridcell"
          className={clsx(cell.column.id, { grow: cell.column.id === 'description' })}
          style={{ width: `var(--col-${cell.column.id})` }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </Styled.Cell>
      ))}
    </Styled.BodyRow>
  )
})
