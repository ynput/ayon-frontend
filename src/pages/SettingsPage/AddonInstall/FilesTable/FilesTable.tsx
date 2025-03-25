import { useMemo, useRef, useState } from 'react'
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
  Row,
  RowSelectionState,
  SortingState,
  TableOptions,
  useReactTable,
} from '@tanstack/react-table'
import { getFileSizeString, Icon } from '@ynput/ayon-react-components'

import { $Any } from '@types'
import { capitalizeFirstLetter } from '@helpers/string'
import BundleStatus from '@pages/SettingsPage/AddonsManager/BundleStatus/BundleStatus'
import { UploadedFile } from '../hooks/useFetchManagerData'

const Container = styled.div`
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: var(--border-radius-m);
  height: 100%;
  overflow: auto;
`

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  cursor: pointer;
  user-select: none;
`

const StyledThead = styled.thead`
  background-color: var(--md-sys-color-surface-container-lowest-dark);
  position: sticky;
  top: 0;
  z-index: 10;
`

const StyledHeadTr = styled.tr`
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

const StyledHeadTd = styled.td`
  padding: 8px;
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
  padding: 8px;
`
interface Props extends Partial<TableOptions<any>> {
  data: UploadedFile[]
  focused: string | null
  rowSelection: Record<string, boolean>
  setRowSelection: (rowSelection: Record<string, boolean>) => void
  setFocused: (focused: string | null) => void
}

const FilesTable: React.FC<Props> = ({
  data,
  focused,
  setFocused,
  setRowSelection,
  rowSelection,
}) => {
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
        sortingFn: (a, b) =>
          compare(coerce(a.original.version) || '', coerce(b.original.version) || ''),
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
      {
        accessorKey: 'statuses',
        cell: (info) => {
          return <BundleStatus statuses={info.getValue() as string[]} />
        },
        header: () => 'Status',
        // based on list length
        sortingFn: (a, b) => (a.original.statuses.length > b.original.statuses.length ? 1 : -1),
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
    getRowId: (row) => row.filename,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // @ts-ignore
    filterFns: {},
  })

  const { rows } = table.getRowModel()

  const lastRowSelected = useRef<Row<$Any> | null>(null)

  const handleRowSelect = (evt: React.MouseEvent, row: Row<File[]>) => {
    // set focused always to last clicked row
    setFocused?.(row.id)

    if (evt.ctrlKey || evt.metaKey) {
      setRowSelection({ ...rowSelection, [row.id]: !rowSelection[row.id] })
    } else if (evt.shiftKey) {
      const lrIndex = lastRowSelected?.current?.id ?? row.id
      const fromIndex = rows.findIndex((r) => r.id === lrIndex)
      const toIndex = rows.findIndex((r) => r.id === row.id)

      const minIndex = Math.min(fromIndex, toIndex)
      const maxIndex = Math.max(fromIndex, toIndex)

      const newRowSelection: RowSelectionState = {}

      for (let i = minIndex; i <= maxIndex; i++) {
        newRowSelection[rows[i].id] = true
      }

      setRowSelection(newRowSelection)
    } else {
      table.resetRowSelection(false)
      const newSelectionRow = !rowSelection[row.id]
      setRowSelection?.({ [row.id]: newSelectionRow })
      if (!newSelectionRow) setFocused(null)
    }

    lastRowSelected.current = row
  }

  return (
    <Container ref={parentRef}>
      <StyledTable>
        <StyledThead>
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
        </StyledThead>
        <tbody>
          {rows.map((row) => {
            return (
              <StyledTr
                key={row.id}
                className={clsx({
                  selected: row.getIsSelected(),
                  focused: focused == row.id,
                })}
                onClick={(evt) => handleRowSelect(evt, row)}
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
    </Container>
  )
}

export default FilesTable
