import { FC, useMemo, useRef } from 'react'
import * as Styled from './SimpleTable.styled'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
  Row,
  FilterFn,
  SortingFn,
  sortingFns,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import useRowSelection from '../../../src/containers/Slicer/hooks/useRowSelection'
import useRowKeydown from '../../../src/containers/Slicer/hooks/useRowKeydown'

import { RankingInfo, rankItem, compareItems } from '@tanstack/match-sorter-utils'
import { useSimpleTableContext } from './context/SimpleTableContext'

declare module '@tanstack/react-table' {
  //add fuzzy filter to the filterFns
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

// Define a custom fuzzy filter function that will apply ranking info to rows (using match-sorter utils)
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank,
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

// Define a custom fuzzy sort function that will sort by rank if the row has ranking information
const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
  let dir = 0

  // Only sort by rank if the column has ranking information
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId]?.itemRank!,
      rowB.columnFiltersMeta[columnId]?.itemRank!,
    )
  }

  // Provide an alphanumeric fallback for when the item ranks are equal
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir
}

export type RowItemData = {
  id: string
  name?: string | null
  label?: string | null
  subType?: string | null
}

export type SimpleTableRow = {
  id: string
  parentId?: string
  name: string
  label: string
  icon?: string | null
  iconColor?: string
  img?: string | null
  startContent?: JSX.Element
  endContent?: JSX.Element
  subRows: SimpleTableRow[]
  data: RowItemData
}

export interface SimpleTableProps {
  data: SimpleTableRow[]
  isLoading: boolean
  isExpandable?: boolean // show expand/collapse icons
  forceUpdateTable?: any
  globalFilter: string
}

const SimpleTable: FC<SimpleTableProps> = ({
  data = [],
  isLoading,
  isExpandable,
  forceUpdateTable,
  globalFilter,
}) => {
  const { rowSelection, expanded, setExpanded, onExpandedChange } = useSimpleTableContext()

  // stable data reference
  const tableData = useMemo(() => {
    if (!isLoading || data.length) return data

    // show loading placeholders
    return Array.from({ length: 10 }, (_, i) => ({
      id: `placeholder-${i}`,
      name: `placeholder-${i}`,
      label: `placeholder-${i}`,
      icon: null,
      img: null,
      subRows: [],
      data: {
        id: `placeholder-${i}`,
      },
    }))
  }, [data, forceUpdateTable])

  const columns = useMemo<ColumnDef<SimpleTableRow>[]>(
    () => [
      {
        accessorKey: 'label',
        header: undefined,
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
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
              isExpandable && <div style={{ display: 'inline-block', minWidth: 24 }} />
            )}
            {row.original.startContent && row.original.startContent}
            {row.original.icon && (
              <Icon icon={row.original.icon} style={{ color: row.original.iconColor }} />
            )}
            <span className="title">{getValue<boolean>()}</span>
            {row.original.endContent && row.original.endContent}
          </Styled.Cell>
        ),
      },
    ],
    [isLoading, forceUpdateTable, tableData, rowSelection],
  )

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      expanded,
      rowSelection,
      globalFilter,
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    enableRowSelection: true, //enable row selection for all rows
    getRowId: (row) => row.id,
    enableSubRowSelection: false, //disable sub row selection
    onExpandedChange: (updater) => {
      setExpanded?.((old) => {
        const newExpanded = updater instanceof Function ? updater(old) : updater
        onExpandedChange?.(newExpanded)
        return newExpanded
      })
    },
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    filterFromLeafRows: true,
    // debugTable: true,
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

  // handles all of the selection logic
  const { handleRowSelect } = useRowSelection({
    table,
    rows,
  })

  const { handleRowKeyDown } = useRowKeydown({ handleRowSelect })

  return (
    <Styled.TableContainer ref={tableContainerRef} className={clsx({ isLoading })}>
      <table>
        <tbody
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index] as Row<SimpleTableRow>
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

export default SimpleTable
