import { FC, useEffect, useMemo, useRef, useState } from 'react'
import * as Styled from './SlicerTable.styled'
import {
  ExpandedState,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
  Row,
  RowSelectionState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import useRowSelection from './hooks/useRowSelection'
import useRowKeydown from './hooks/useRowKeydown'
import usePlaceholderData from './hooks/usePlaceholderData'

export type TableRow = {
  id: string
  parentId?: string
  name: string
  label: string
  icon?: string | null
  img?: string | null
  subRows: TableRow[]
}

interface SlicerTableProps {
  data: TableRow[]
  isLoading: boolean
}

const SlicerTable: FC<SlicerTableProps> = ({ data = [], isLoading }) => {
  // stable data reference
  const [tableData, setTableData] = useState(data)

  useEffect(() => {
    setTableData(data)
  }, [data, isLoading])

  // show loading placeholders
  usePlaceholderData({ data: tableData, isLoading, setTableData })

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const columns = useMemo<ColumnDef<TableRow>[]>(
    () => [
      {
        accessorKey: 'label',
        header: undefined,
        cell: ({ row, getValue }) => (
          <Styled.Cell
            className={clsx({ selected: row.getIsSelected(), loading: isLoading })}
            onClick={(evt) => handleRowSelect(evt, row)}
            onKeyDown={(evt) => handleRowKeyDown(evt, row)}
            style={{
              //  add depth padding to the cell
              paddingLeft: `calc(${row.depth * 0.5}rem + 4px)`,
            }}
            tabIndex={0}
          >
            {row.getCanExpand() ? (
              <Styled.Expander
                onClick={(e) => {
                  e.stopPropagation()
                  row.getToggleExpandedHandler()()
                }}
                icon={row.getIsExpanded() ? 'expand_more' : 'chevron_right'}
                style={{ cursor: 'pointer' }}
              />
            ) : (
              <div style={{ display: 'inline-block', minWidth: 24 }} />
            )}
            {row.original.icon && <Icon icon={row.original.icon} />}
            <span className="title">{getValue<boolean>()}</span>
          </Styled.Cell>
        ),
      },
    ],
    [isLoading],
  )

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      expanded,
      rowSelection,
    },
    enableRowSelection: true, //enable row selection for all rows
    getRowId: (row) => row.id,
    enableSubRowSelection: false, //disable sub row selection
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    filterFromLeafRows: true,
    debugTable: true,
  })

  const { rows } = table.getRowModel()

  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 40, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  })

  const { handleRowSelect } = useRowSelection({
    table,
    rows,
    rowSelection,
    setRowSelection,
  })

  const { handleRowKeyDown } = useRowKeydown({ handleRowSelect })

  return (
    <Styled.TableContainer ref={tableContainerRef} className={clsx({ isLoading })}>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index] as Row<TableRow>
            return (
              <tr
                data-index={virtualRow.index} //needed for dynamic row height measurement
                ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
                key={row.id}
                style={{
                  transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
                }}
              >
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </Styled.TableContainer>
  )
}

export default SlicerTable