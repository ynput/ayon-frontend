import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { MouseEvent, useMemo, useState } from 'react'
import { $Any } from '@types'
import styled from 'styled-components'
import clsx from 'clsx'
import { getFileSizeString, Icon } from '@ynput/ayon-react-components'
import { capitalizeFirstLetter } from '@helpers/string'

const StyledTable = styled.table`
  width: 100%;
  overflow: scroll;
  border-collapse: collapse;
  cursor: pointer;
  user-select: none;
`
const StyledHeadTr = styled.tr`
  background-color: var(--md-sys-color-surface-container-lowest-dark);
`

const StyledTr = styled.tr`
  &.selected {
    background-color: var(--md-sys-color-primary-container);
    // outline: solid .15rem var(--focus-color)
  }
`

const StyledTd = styled.td`
  text-align: start;
`
type Props = {
  data: $Any
  selection: number[]
  rowClickHandler: (e: MouseEvent, rowIdx: number) => void
}

const FilesTable: React.FC<Props> = ({ data, selection, rowClickHandler }) => {
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([])

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
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div>
      <div />
      <StyledTable>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <StyledTr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <StyledTd
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
                      }[header.column.getIsSorted() as string] ?? (
                        <Icon icon="arrow_upward" style={{ visibility: 'hidden' }} />
                      )}
                    </div>
                  )}
                </StyledTd>
              ))}
            </StyledTr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            return (
              <StyledTr
                key={row.id}
                className={clsx({ selected: selection.includes(row.index) })}
                onClick={(e) => rowClickHandler(e, row.index)}
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
  )
}

export default FilesTable
