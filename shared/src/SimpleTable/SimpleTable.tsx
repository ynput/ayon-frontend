import { FC, useMemo, useRef, memo } from 'react'
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

import clsx from 'clsx'
import useRowSelection from '../../../src/containers/Slicer/hooks/useRowSelection'
import useRowKeydown from '../../../src/containers/Slicer/hooks/useRowKeydown'

import { RankingInfo, rankItem, compareItems } from '@tanstack/match-sorter-utils'
import { useSimpleTableContext } from './context/SimpleTableContext'
import { SimpleTableCellTemplate, SimpleTableCellTemplateProps } from './SimpleTableRowTemplate'
import { EmptyPlaceholder } from '@shared/components'

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
  [key: string]: any
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
  error?: string
  isExpandable?: boolean // show expand/collapse icons
  forceUpdateTable?: any
  globalFilter?: string
  children?: (props: SimpleTableCellTemplateProps, row: Row<SimpleTableRow>) => JSX.Element
}

const SimpleTable: FC<SimpleTableProps> = ({
  data = [],
  isLoading,
  error,
  isExpandable,
  forceUpdateTable,
  globalFilter,
  children,
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
  }, [isLoading, data, forceUpdateTable])

  const columns = useMemo<ColumnDef<SimpleTableRow>[]>(
    () => [
      {
        accessorKey: 'label',
        header: undefined,
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        cell: ({ row, getValue }) => {
          const props: SimpleTableCellTemplateProps = {
            className: clsx({ selected: row.getIsSelected(), loading: isLoading }),
            onClick: (e) => {
              // check we are not clicking on an input
              if (e.target instanceof HTMLInputElement) return
              handleRowSelect(e, row)
            },
            onKeyDown: (e) => {
              // check we are not clicking on an input
              if (e.target instanceof HTMLInputElement) return
              handleRowKeyDown(e, row)
            },
            depth: row.depth,
            tabIndex: 0,
            value: getValue<string>(),
            icon: row.original.icon || undefined,
            iconColor: row.original.iconColor,
            isRowExpandable: row.getCanExpand(),
            isRowExpanded: row.getIsExpanded(),
            isTableExpandable: isExpandable,
            onExpandClick: row.getToggleExpandedHandler(),
            startContent: row.original.startContent,
            endContent: row.original.endContent,
          }

          // Use children function if provided, otherwise default to SimpleTableCellTemplate
          return children ? children(props, row) : <SimpleTableCellTemplate {...props} />
        },
      },
    ],
    [isLoading, forceUpdateTable, children, tableData, rowSelection, isExpandable],
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
      {!error && (
        <table>
          <tbody
            style={{
              height: `${rowVirtualizer?.getTotalSize()}px`, //tells scrollbar how big the table is
            }}
          >
            {rowVirtualizer?.getVirtualItems().map((virtualRow) => {
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
      )}
      {!!error && <EmptyPlaceholder error={error} />}
    </Styled.TableContainer>
  )
}

export default SimpleTable
