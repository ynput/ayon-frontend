import { FC, useMemo, useRef, MouseEvent as ReactMouseEvent, useCallback, useEffect } from 'react'
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
  RowData,
  Table,
  OnChangeFn,
  RowSelectionState,
  functionalUpdate,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

import clsx from 'clsx'
import useRowKeydown, { RowKeyboardEvent } from './hooks/useRowKeydown'

import { RankingInfo, rankItem, compareItems } from '@tanstack/match-sorter-utils'
import { useSimpleTableContext } from './context/SimpleTableContext'
import { SimpleTableCellTemplate, SimpleTableCellTemplateProps } from './SimpleTableRowTemplate'
import { EmptyPlaceholder } from '@shared/components'
import { RowPinningState } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  //add fuzzy filter to the filterFns
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }

  interface TableMeta<TData extends RowData> {
    isExpandable?: boolean
    isLoading?: boolean
    children?: (
      props: SimpleTableCellTemplateProps,
      row: Row<TData>,
      table: Table<SimpleTableRow>,
    ) => JSX.Element
    [key: string]: any
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
  parents?: string[]
  icon?: string | null
  iconColor?: string
  iconFilled?: boolean
  img?: string | null
  startContent?: JSX.Element
  endContent?: JSX.Element
  subRows: SimpleTableRow[]
  data: RowItemData
  isDisabled?: boolean
  disabledMessage?: string
  inactive?: boolean
}

export interface SimpleTableProps {
  data: SimpleTableRow[]
  isLoading: boolean
  error?: string
  isExpandable?: boolean // show expand/collapse icons
  isMultiSelect?: boolean // enable multi-select with shift+click and ctrl/cmd+click
  enableClickToDeselect?: boolean // allow deselecting a single selected row by clicking it again & clicking outside clears selection
  enableNonFolderIndent?: boolean // indent non-folder rows to align with folder rows
  forceUpdateTable?: any
  globalFilter?: string
  meta?: Record<string, any>
  rowHeight?: number // height of each row, used for virtual scrolling
  onScrollBottom?: () => void // callback fired when scrolled to the bottom of the table
  children?: (
    props: SimpleTableCellTemplateProps,
    row: Row<SimpleTableRow>,
    table: Table<SimpleTableRow>,
  ) => JSX.Element
  pt?: {
    cell?: SimpleTableCellTemplateProps
    row?: React.HTMLAttributes<HTMLTableRowElement>
  }
}

// Helper function to get row range for shift-selection
// Operates on the provided list of rows (e.g., filtered and sorted rows)
function getRowRange<TData extends RowData>(
  rows: Array<Row<TData>>,
  idA: string,
  idB: string,
): Array<Row<TData>> {
  const range: Array<Row<TData>> = []
  // If idA and idB are the same, or one is not found, handle appropriately
  if (idA === idB) {
    const singleRow = rows.find((row) => row.id === idA)
    return singleRow ? [singleRow] : []
  }

  let indexA = -1
  let indexB = -1

  for (let i = 0; i < rows.length; i++) {
    if (rows[i].id === idA) indexA = i
    if (rows[i].id === idB) indexB = i
    if (indexA !== -1 && indexB !== -1) break
  }

  if (indexA === -1 || indexB === -1) return [] // One or both IDs not found

  const start = Math.min(indexA, indexB)
  const end = Math.max(indexA, indexB)

  for (let i = start; i <= end; i++) {
    range.push(rows[i])
  }
  return range
}

const SimpleTable: FC<SimpleTableProps> = ({
  data = [],
  isLoading,
  error,
  isExpandable,
  isMultiSelect = true,
  enableClickToDeselect = true,
  enableNonFolderIndent = true,
  forceUpdateTable,
  globalFilter,
  meta,
  rowHeight,
  onScrollBottom,
  children,
  pt,
}) => {
  const {
    rowSelection,
    expanded,
    setExpanded,
    onExpandedChange,
    onRowSelectionChange,
    rowPinning,
    onRowPinningChange,
  } = useSimpleTableContext()
  const lastSelectedIdRef = useRef<string | null>(null)
  const tableRef = useRef<Table<SimpleTableRow> | null>(null)

  // stable data reference
  const tableData = useMemo(() => {
    if (!isLoading) return data

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

  // Define the core selection logic using useCallback for stability
  const handleSelectionLogic = useCallback(
    (
      tableInstance: Table<SimpleTableRow>,
      rowId: string,
      isShift: boolean,
      isCtrlOrMeta: boolean,
    ) => {
      const currentId = rowId
      const allProcessableRows = tableInstance.getFilteredRowModel().flatRows
      const currentRow = allProcessableRows.find((r) => r.id === currentId)

      if (!currentRow) return

      // Prevent selection of disabled rows
      if (currentRow.original.isDisabled) return

      // If click-to-deselect is enabled and only one row is selected and it's the current row
      if (
        enableClickToDeselect &&
        !isShift &&
        !isCtrlOrMeta &&
        Object.keys(tableInstance.getState().rowSelection).length === 1 &&
        tableInstance.getState().rowSelection[currentId]
      ) {
        tableInstance.setRowSelection({})
        lastSelectedIdRef.current = null
        return
      }

      if (isMultiSelect && isShift && lastSelectedIdRef.current) {
        const lastId = lastSelectedIdRef.current
        const anchorRow = allProcessableRows.find((r) => r.id === lastId)

        if (!anchorRow) {
          tableInstance.setRowSelection({ [currentId]: true })
        } else {
          const rowsToToggle = getRowRange(allProcessableRows, currentId, lastId)
          const newSelection: RowSelectionState = {}
          rowsToToggle.forEach((r) => (newSelection[r.id] = true))
          tableInstance.setRowSelection(newSelection)
        }
      } else if (isMultiSelect && isCtrlOrMeta) {
        currentRow.toggleSelected()
      } else {
        tableInstance.setRowSelection({ [currentId]: true })
      }
      lastSelectedIdRef.current = currentId
    },
    [isMultiSelect, enableClickToDeselect],
  )

  // Callback for useRowKeydown's handleRowSelect prop
  // Uses tableRef to access the table instance, avoiding direct dependency on 'table' variable at definition time
  const handleRowSelectForKeydown = useCallback(
    (
      event: RowKeyboardEvent, // Use the specific keyboard event type from the hook
      selectedRow: Row<SimpleTableRow>,
    ) => {
      if (!tableRef.current) {
        console.warn('tableRef not yet available in handleRowSelectForKeydown')
        return
      }

      // Extract modifier keys from the event
      const isShiftKey = event.shiftKey
      const isCtrlKey = event.ctrlKey || event.metaKey

      handleSelectionLogic(
        tableRef.current, // Pass the main table instance
        selectedRow.id,
        isShiftKey,
        isCtrlKey,
      )
    },
    [handleSelectionLogic], // Depends only on handleSelectionLogic
  )

  const { handleRowKeyDown } = useRowKeydown<SimpleTableRow>({
    handleRowSelect: handleRowSelectForKeydown,
  })

  const columns = useMemo<ColumnDef<SimpleTableRow>[]>(
    () => [
      {
        accessorKey: 'label',
        header: undefined,
        filterFn: 'fuzzy',
        sortingFn: fuzzySort, //sort by fuzzy rank (falls back to alphanumeric)
        cell: ({ row, getValue, table: cellTableInstance }) => {
          const cellMeta = cellTableInstance.options.meta

          const handleCellClick = (event: ReactMouseEvent<HTMLElement, MouseEvent>) => {
            // Prevent row selection if clicking on an interactive element within the cell
            if (
              event.target instanceof HTMLInputElement ||
              event.target instanceof HTMLButtonElement ||
              event.target instanceof HTMLTextAreaElement ||
              event.target instanceof HTMLSelectElement ||
              event.target instanceof HTMLAnchorElement ||
              (event.target as HTMLElement).closest('button, a, input, textarea, select')
            ) {
              return
            }
            handleSelectionLogic(
              cellTableInstance, // Pass the cell's table instance
              row.id,
              event.shiftKey,
              event.ctrlKey || event.metaKey,
            )
          }

          const props: SimpleTableCellTemplateProps & {
            onClick?: (event: ReactMouseEvent<HTMLElement, MouseEvent>) => void
          } = {
            className: clsx({
              selected: row.getIsSelected(),
              loading: cellMeta?.isLoading,
              disabled: row.original.isDisabled, // you can't select disabled rows
              inactive: row.original.inactive, // false: archived items but still selectable
            }),
            onKeyDown: (e) => {
              if (e.target instanceof HTMLInputElement) return
              // Corrected typo: handleRowKeydown -> handleRowKeyDown
              handleRowKeyDown(e, row)
            },
            onClick: handleCellClick, // Added onClick handler
            depth: row.depth,
            tabIndex: 0,
            value: getValue<string>(),
            parents: row.original.parents,
            icon: row.original.icon || undefined,
            iconColor: row.original.iconColor,
            iconFilled: row.original.iconFilled,
            isRowExpandable: row.getCanExpand(),
            enableNonFolderIndent,
            isRowExpanded: row.getIsExpanded(),
            isTableExpandable: cellMeta?.isExpandable,
            onExpandClick: row.getToggleExpandedHandler(),
            startContent: row.original.startContent,
            endContent: row.original.endContent,
            isDisabled: row.original.isDisabled,
            disabledMessage: row.original.disabledMessage,
          }

          // Use children function if provided, otherwise default to SimpleTableCellTemplate
          return cellMeta?.children ? (
            cellMeta.children(props, row, cellTableInstance)
          ) : (
            <SimpleTableCellTemplate {...props} {...pt?.cell} />
          )
        },
      },
    ],
    [
      forceUpdateTable,
      handleSelectionLogic,
      handleRowKeyDown,
      enableClickToDeselect,
      enableNonFolderIndent,
    ], // include enableClickToDeselect for completeness
  )

  const handleRowSelectionChangeCallback: OnChangeFn<RowSelectionState> = useCallback(
    (updater) => {
      onRowSelectionChange(functionalUpdate(updater, rowSelection))
    },
    [onRowSelectionChange, rowSelection], // Depends only on the stable setState function from context
  )

  const handleRowPinningChangeCallback: OnChangeFn<RowPinningState> = useCallback(
    (updater) => {
      rowPinning && onRowPinningChange?.(functionalUpdate(updater, rowPinning))
    },
    [onRowPinningChange], // Depends only on the stable setState function from context
  )

  const handleExpandedChange = useCallback(
    (updater: any) => {
      setExpanded?.((old) => {
        const newExpanded = updater instanceof Function ? updater(old) : updater
        onExpandedChange?.(newExpanded)
        return newExpanded
      })
    },
    [setExpanded, onExpandedChange],
  )

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      expanded,
      rowSelection,
      globalFilter,
      rowPinning,
    },
    onRowSelectionChange: handleRowSelectionChangeCallback,
    onRowPinningChange: handleRowPinningChangeCallback,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    enableRowSelection: true, //enable row selection for all rows
    enableRowPinning: !!onRowPinningChange,
    getRowId: (row) => row.id,
    enableSubRowSelection: false, //disable sub row selection
    onExpandedChange: handleExpandedChange,
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    filterFromLeafRows: true,
    // debugTable: true,
    meta: {
      isExpandable: !!isExpandable,
      isLoading: isLoading,
      children: children,
      ...meta,
    },
  })

  // Update tableRef whenever the table instance changes.
  // This ensures handleRowSelectForKeydown uses the current table instance.
  useEffect(() => {
    tableRef.current = table
  }, [table])

  const { rows } = table.getRowModel()

  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight || 34, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement: rowHeight
      ? () => rowHeight
      : typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
      ? (element) => element?.getBoundingClientRect().height
      : undefined,
    overscan: 5,
  })

  // Memoize the ref callback to prevent infinite re-renders
  const measureElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (node) {
        rowVirtualizer.measureElement(node)
      }
    },
    [rowVirtualizer],
  )

  // Handle scroll to bottom detection
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!onScrollBottom) return

      const target = event.currentTarget
      const { scrollTop, scrollHeight, clientHeight } = target

      // Check if we're near the bottom (within 100px)
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

      if (isNearBottom && !isLoading) {
        onScrollBottom()
      }
    },
    [onScrollBottom, isLoading],
  )

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // if the click is outside of any row, clear selection
    if (enableClickToDeselect && !(e.target as HTMLElement).closest('tr')) {
      table.setRowSelection({})
      lastSelectedIdRef.current = null
    }
  }

  return (
    <Styled.TableContainer
      ref={tableContainerRef}
      className={clsx({ isLoading })}
      onScroll={handleScroll}
      onClick={handleContainerClick}
    >
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
                  ref={measureElementRef} //measure dynamic row height
                  key={row.id}
                  id={row.id}
                  {...pt?.row}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
                    ...pt?.row?.style, // custom styles to be passed
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
