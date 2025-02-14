import { MouseEvent, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import clsx from 'clsx'
import { coerce } from 'semver'
import compare from 'semver/functions/compare'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { getFileSizeString, Icon } from '@ynput/ayon-react-components'

import { $Any } from '@types'
import { capitalizeFirstLetter } from '@helpers/string'

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  cursor: pointer;
  user-select: none;
`
const StyledHeadTr = styled.tr`
  background-color: var(--md-sys-color-surface-container-lowest-dark);
`

const StyledHeadTd = styled.td`
  box-shadow: inset 0 0 1px 1px var(--md-sys-color-surface-container);
  margin: 1px;
  padding: 2px 4px;
`

const StyledTr = styled.tr`
  &.selected {
    background-color: var(--md-sys-color-primary-container);
  }
  &.focused {
    outline: solid 0.15rem var(--focus-color);
    outline-offset: -0.15rem;
  }
`

const StyledTd = styled.td`
  text-align: start;
`
type Props = {
  data: $Any
  selection: number[]
  focused: number
  rowClickHandler: (e: MouseEvent, rowIdx: number) => void
}

const FilesTable: React.FC<Props> = ({ data, selection, focused, rowClickHandler }) => {
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([])
  const parentRef = useRef<HTMLDivElement>(null)

  const columns = useMemo<ColumnDef<$Any>[]>(
    () => [
      {
        accessorKey: 'filename',
        header: 'File name',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'version',
        id: 'version',
        cell: (info) => info.getValue(),
        header: () => 'Installer version',
        sortingFn: (a, b) => compare(coerce(a.original.version), coerce(b.original.version)),
      },
      {
        accessorKey: 'platform',
        cell: (info) => {
          return capitalizeFirstLetter(info.getValue() as string)
        },
        header: () => 'Platform',
      },
      {
        accessorKey: 'size',
        cell: (info) => {
          return getFileSizeString(parseInt(info.getValue() as string) ?? 0)
        },
        header: () => 'Size',
      },
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      sorting,
    },
    debugTable: true,
    enableRowSelection: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    getFilteredRowModel: getFilteredRowModel(),
  })

  const { rows } = table.getRowModel()
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 34,
    overscan: 20,
  })

  return (
    <div ref={parentRef} style={{ overflow: 'auto', height: '100%' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <StyledTable>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <StyledHeadTr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <StyledHeadTd
                    key={header.id}
                    colSpan={header.colSpan}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div style={{ display: 'flex' }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <Icon icon="arrow_downward" />,
                          desc: <Icon icon="arrow_upward" />,
                        }[header.column.getIsSorted() as string] ?? <Icon icon="swap_vert" />}
                      </div>
                    )}
                  </StyledHeadTd>
                ))}
              </StyledHeadTr>
            ))}
          </thead>
          <tbody>
            {virtualizer.getVirtualItems().map((virtualRow, index) => {
              const row = rows[virtualRow.index]

              return (
                <StyledTr
                  key={row.id}
                  className={clsx({
                    selected: selection.includes(row.index),
                    focused: focused == row.index,
                  })}
                  onClick={(e) => rowClickHandler(e, row.index)}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start - index * virtualRow.size}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <StyledTd key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </StyledTd>
                    )
                  })}
                </StyledTr>
              )
            })}
          </tbody>
        </StyledTable>
      </div>
    </div>
  )
}

export default FilesTable
