import { FC, useMemo, useRef, useState } from 'react'
import * as Styled from './Slicer.styled'
import {
  ExpandedState,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
  Row,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

import { Icon } from '@ynput/ayon-react-components'
import './slicer.scss'
import clsx from 'clsx'

type Folder = {
  id: string
  name: string
  icon: string
  subRows?: Folder[]
}

const createFolders = (count: number): Folder[] => {
  return Array.from({ length: count }, (_, i) => {
    const id = `folder-${i}`
    return {
      id,
      name: id,
      icon: 'folder',
    }
  })
}

const hierarchyData: Folder[] = [
  {
    id: 'assets',
    name: 'assets',
    icon: 'category',
    subRows: [
      {
        id: 'characters',
        name: 'characters',
        icon: 'folder',
        subRows: [
          {
            id: 'hero',
            name: 'hero',
            icon: 'smart_toy',
          },
          {
            id: 'villain',
            name: 'villain',
            icon: 'smart_toy',
          },
          {
            id: 'npc',
            name: 'npc',
            icon: 'smart_toy',
          },
        ],
      },
      {
        id: 'environments',
        name: 'environments',
        icon: 'folder',
        subRows: [
          {
            id: 'forest',
            name: 'forest',
            icon: 'nature',
          },
          {
            id: 'desert',
            name: 'desert',
            icon: 'nature',
          },
          {
            id: 'city',
            name: 'city',
            icon: 'nature',
          },
        ],
      },
    ],
  },
  {
    id: 'shots',
    name: 'shots',
    icon: 'folder',
    subRows: createFolders(2000),
  },
]

interface SlicerProps {}

const Slicer: FC<SlicerProps> = ({}) => {
  const columns = useMemo<ColumnDef<Folder>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ table }) => (
          <>
            <Icon
              onClick={() => table.getToggleAllRowsExpandedHandler()}
              icon={table.getIsAllRowsExpanded() ? 'expand_less' : 'expand_more'}
            />
            Name
          </>
        ),
        cell: ({ row, getValue, cell }) => (
          <div
            style={{
              // Since rows are flattened by default,
              // we can use the row.depth property
              // and paddingLeft to visually indicate the depth
              // of the row
              paddingLeft: `${row.depth * 1}rem`,
            }}
          >
            <div style={{ textAlign: 'left' }}>
              {row.getCanExpand() ? (
                <Icon
                  onClick={(e) => {
                    e.stopPropagation()
                    row.getToggleExpandedHandler()()
                  }}
                  icon={row.getIsExpanded() ? 'expand_more' : 'chevron_right'}
                  style={{ cursor: 'pointer' }}
                />
              ) : (
                <div style={{ display: 'inline-block', width: 20 }} />
              )}
              {/* <Icon icon={row.getValue('icon')} /> */}
              {getValue<boolean>()}
            </div>
          </div>
        ),
      },
    ],
    [],
  )

  const [tableData, setTableData] = useState<Folder[]>(hierarchyData)

  const [rowSelection, setRowSelection] = useState({})
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      expanded,
      rowSelection,
    },
    enableRowSelection: true, //enable row selection for all rows
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    filterFromLeafRows: true,
    // maxLeafRowFilterDepth: 0,
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

  return (
    <Styled.Container ref={tableContainerRef}>
      <table style={{ display: 'grid' }}>
        <thead
          style={{
            display: 'grid',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
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
            display: 'grid',
            height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
            position: 'relative', //needed for absolute positioning of rows
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index] as Row<Folder>
            return (
              <Styled.TR
                data-index={virtualRow.index} //needed for dynamic row height measurement
                ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
                key={row.id}
                style={{
                  display: 'flex',
                  position: 'absolute',
                  transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
                  width: '100%',
                }}
                className={clsx({ selected: row.getIsSelected() })}
                onClick={row.getToggleSelectedHandler()}
              >
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td
                      key={cell.id}
                      style={{
                        display: 'flex',
                        width: cell.column.getSize(),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  )
                })}
              </Styled.TR>
            )
          })}
        </tbody>
      </table>
    </Styled.Container>
  )
}

export default Slicer
