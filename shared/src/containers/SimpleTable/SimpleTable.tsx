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
  Table,
  RowData,
  OnChangeFn,
  RowSelectionState,
  functionalUpdate,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

import clsx from 'clsx'
import useRowKeydown, { RowKeyboardEvent } from './hooks/useRowKeydown'

import { rankItem, compareItems, rankings } from '@tanstack/match-sorter-utils'
import { useSimpleTableContext } from './context/SimpleTableContext'
import { SimpleTableCellTemplate, SimpleTableCellTemplateProps } from './SimpleTableRowTemplate'
import { EmptyPlaceholder } from '@shared/components'
import { RowPinningState } from '@tanstack/react-table'
import {
  SimpleTableProps,
  SimpleTableRow,
  SimpleTableRowContextMenuBuilder,
} from './SimpleTable.types'
import { useCreateContextMenu } from '../ContextMenu'

const toMenuItems = (items: ReturnType<SimpleTableRowContextMenuBuilder>) => {
  if (!items) return []
  return Array.isArray(items) ? items.filter(Boolean) : [items]
}

const toggleRowAndDescendants = <TData,>(row: Row<TData>, expanded: boolean) => {
  row.toggleExpanded(expanded)
  row.subRows.forEach((subRow) => toggleRowAndDescendants(subRow, expanded))
}

// Define a custom fuzzy filter function that will apply ranking info to rows (using match-sorter utils)
const fuzzyFilter: FilterFn<any> = (row, columnId, searchValue, addMeta) => {
  const cellValue = row.getValue(columnId)
  // convert non-string cell values to string
  let searchString =
    typeof cellValue === 'string'
      ? cellValue
      : Array.isArray(cellValue)
      ? cellValue.join(' ')
      : JSON.stringify(cellValue)

  // combine label and parents into a single string for searching if columnId is 'label'
  if (columnId === 'label') {
    searchString = [row.original.label, row.original.name, ...(row.original.parents || [])].join(
      ' ',
    )
  }

  // Rank the item with CONTAINS threshold to avoid overly permissive fuzzy matches
  // This ensures the search term must be a substring, not just scattered characters
  const itemRank = rankItem(searchString, searchValue, { threshold: rankings.CONTAINS })

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
  imgRatio,
  onScrollBottom,
  onRename,
  renamingId,
  renameInitialValue,
  onSubmitRename,
  onCancelRename,
  onRowDoubleClick,
  onRowOptionClick,
  rowContextMenuBuilders = [],
  children,
  pt,
  fitContent,
  ...props
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
  const [showRowContextMenu] = useCreateContextMenu()

  // Refs for values used inside the columns memo.
  // Assigning synchronously (not via useEffect) means the cell function always reads
  // the latest value at render time, while the columns memo itself has a minimal dep
  // array and stays as a stable reference — critical because flexRender calls
  // React.createElement with the cell function, so a new reference = remount = broken dblclick.
  const onRowDoubleClickRef = useRef(onRowDoubleClick)
  onRowDoubleClickRef.current = onRowDoubleClick
  const renamingIdRef = useRef(renamingId)
  renamingIdRef.current = renamingId
  const renameInitialValueRef = useRef(renameInitialValue)
  renameInitialValueRef.current = renameInitialValue
  const onSubmitRenameRef = useRef(onSubmitRename)
  onSubmitRenameRef.current = onSubmitRename
  const onCancelRenameRef = useRef(onCancelRename)
  onCancelRenameRef.current = onCancelRename
  const onRenameRef = useRef(onRename)
  onRenameRef.current = onRename

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
    ): RowSelectionState => {
      const currentId = rowId
      const allProcessableRows = tableInstance.getFilteredRowModel().flatRows
      const currentRow = allProcessableRows.find((r) => r.id === currentId)

      if (!currentRow) return { ...(tableInstance.getState().rowSelection || {}) }

      // Prevent selection of disabled rows
      if (currentRow.original.isDisabled) {
        return { ...(tableInstance.getState().rowSelection || {}) }
      }

      // If click-to-deselect is enabled and only one row is selected and it's the current row
      if (
        enableClickToDeselect &&
        !isShift &&
        !isCtrlOrMeta &&
        Object.keys(tableInstance.getState().rowSelection || {}).length === 1 &&
        (tableInstance.getState().rowSelection || {})[currentId]
      ) {
        tableInstance.setRowSelection({})
        lastSelectedIdRef.current = null
        return {}
      }

      let nextSelection: RowSelectionState
      if (isMultiSelect && isShift && lastSelectedIdRef.current) {
        const lastId = lastSelectedIdRef.current
        const anchorRow = allProcessableRows.find((r) => r.id === lastId)

        if (!anchorRow) {
          nextSelection = { [currentId]: true }
        } else {
          const rowsToToggle = getRowRange(allProcessableRows, currentId, lastId)
          nextSelection = {}
          rowsToToggle.forEach((r) => (nextSelection[r.id] = true))
        }
      } else if (isMultiSelect && isCtrlOrMeta) {
        // write a concrete object from live state; toggleSelected()'s functional updater runs
        // against a stale rowSelection closure and drops the other selected rows
        nextSelection = { ...(tableInstance.getState().rowSelection || {}) }
        if (nextSelection[currentId]) {
          delete nextSelection[currentId]
        } else {
          nextSelection[currentId] = true
        }
      } else {
        // If it's already selected and it's the only one, don't update selection to avoid unnecessary re-renders
        nextSelection = { ...(tableInstance.getState().rowSelection || {}) }
        if (!(Object.keys(nextSelection).length === 1 && nextSelection[currentId])) {
          nextSelection = { [currentId]: true }
        }
      }
      tableInstance.setRowSelection(nextSelection)
      lastSelectedIdRef.current = currentId
      return nextSelection
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

  // Handle arrow key navigation
  const handleArrowNavigation = useCallback(
    (direction: 'up' | 'down', currentRow: Row<SimpleTableRow>, event: RowKeyboardEvent) => {
      if (!tableRef.current) return

      // Use the row model which respects expanded state, not filtered model
      const visibleRows = tableRef.current.getRowModel().rows
      const currentIndex = visibleRows.findIndex((r) => r.id === currentRow.id)

      if (currentIndex === -1) return

      let nextIndex = direction === 'down' ? currentIndex + 1 : currentIndex - 1

      // Check bounds
      if (nextIndex < 0 || nextIndex >= visibleRows.length) return

      // Skip disabled rows
      while (nextIndex >= 0 && nextIndex < visibleRows.length) {
        const nextRow = visibleRows[nextIndex]
        if (!nextRow.original.isDisabled) {
          // Found a valid row
          // Select the next row
          handleSelectionLogic(
            tableRef.current,
            nextRow.id,
            event.shiftKey,
            event.ctrlKey || event.metaKey,
          )

          // Focus the next row's cell. Scope to this table's container: row ids are
          // entity ids that can also exist in other SimpleTables on the page (slicer),
          // so a document-wide getElementById would steal focus to a duplicate.
          requestAnimationFrame(() => {
            const container = tableContainerRef.current
            const nextRowElement = container
              ? container.querySelector(`#${CSS.escape(nextRow.id)}`)
              : document.getElementById(nextRow.id)
            const nextCell = nextRowElement?.querySelector('[tabindex="0"]') as HTMLElement
            if (nextCell) {
              nextCell.focus()
              nextCell.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
            }
          })
          return
        }
        // Move to next row if current is disabled
        nextIndex = direction === 'down' ? nextIndex + 1 : nextIndex - 1
      }
    },
    [handleSelectionLogic],
  )

  // handleRenameForKeydown reads from onRenameRef so it has empty deps and is
  // permanently stable — keeping handleRowKeyDown and therefore columns stable.
  const handleRenameForKeydown = useCallback(
    (e: RowKeyboardEvent, row: Row<SimpleTableRow>) => {
      if (!row.original.isDisabled) onRenameRef.current?.(row.id, row)
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const { handleRowKeyDown } = useRowKeydown<SimpleTableRow>({
    handleRowSelect: handleRowSelectForKeydown,
    handleArrowNavigation,
    handleRename: handleRenameForKeydown,
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
            // Keep an already-selected row selected for a plain option click.
            // Modifier clicks still go through the normal range/toggle selection path.
            const preserveSelection =
              event.altKey &&
              row.getIsSelected() &&
              !event.shiftKey &&
              !event.ctrlKey &&
              !event.metaKey
            const nextSelection: RowSelectionState = !preserveSelection
              ? handleSelectionLogic(
                  cellTableInstance, // Pass the cell's table instance
                  row.id,
                  event.shiftKey,
                  event.ctrlKey || event.metaKey,
                )
              : cellTableInstance.getState().rowSelection || {}
            if (event.altKey) {
              onRowOptionClick?.(row.original, Object.keys(nextSelection))
            }
          }

          const props: SimpleTableCellTemplateProps & {
            onClick?: (event: ReactMouseEvent<HTMLElement, MouseEvent>) => void
            onDoubleClick?: (event: ReactMouseEvent<HTMLElement, MouseEvent>) => void
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
            depth: row.depth,
            tabIndex: 0,
            value: getValue<string>(),
            parents: row.original.parents,
            icon: row.original.icon || undefined,
            iconColor: row.original.iconColor,
            iconFilled: row.original.iconFilled,
            img: row.original.img,
            imgShape: row.original.imgShape,
            imgRatio: imgRatio,
            isRowExpandable: row.getCanExpand(),
            enableNonFolderIndent,
            isRowExpanded: row.getIsExpanded(),
            isTableExpandable: cellMeta?.isExpandable,
            onExpandClick: (event?: ReactMouseEvent<HTMLElement, MouseEvent>) => {
              if (event?.altKey) {
                toggleRowAndDescendants(row, !row.getIsExpanded())
              } else {
                row.toggleExpanded()
              }
            },
            startContent: row.original.startContent,
            endContent: row.original.endContent,
            isDisabled: row.original.isDisabled,
            disabledMessage: row.original.disabledMessage,
            isRenaming: row.id === renamingIdRef.current,
            renameInitialValue:
              row.id === renamingIdRef.current ? renameInitialValueRef.current : undefined,
            onSubmitRename: onSubmitRenameRef.current
              ? (v) => onSubmitRenameRef.current!(row.id, v)
              : undefined,
            onCancelRename: onCancelRenameRef.current,
            ...pt?.cell,
            onClick: handleCellClick, // Added onClick handler
            onDoubleClick: (e) => onRowDoubleClickRef.current?.(row.id, row),
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
      imgRatio,
      onRowOptionClick,
    ],
  )

  const handleRowSelectionChangeCallback: OnChangeFn<RowSelectionState> = useCallback(
    (updater) => {
      onRowSelectionChange(functionalUpdate(updater, rowSelection))
    },
    [onRowSelectionChange],
  )

  const handleRowPinningChangeCallback: OnChangeFn<RowPinningState> = useCallback(
    (updater) => {
      onRowPinningChange?.(functionalUpdate(updater, rowPinning || {}))
    },
    [onRowPinningChange],
  )

  const handleExpandedChange = useCallback(
    (updater: any) => {
      setExpanded?.((old) => {
        const newExpanded = updater instanceof Function ? updater(old) : updater
        onExpandedChange?.(newExpanded)
        return newExpanded
      })
    },
    [setExpanded],
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
    globalFilterFn: 'fuzzy',
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
    // @ts-expect-error: updateData is not required
    meta: useMemo(
      () => ({
        isExpandable: !!isExpandable,
        isLoading: isLoading,
        children: children,
        ...meta,
      }),
      [isExpandable, isLoading, children, meta],
    ),
  })

  // Update tableRef whenever the table instance changes.
  // This ensures handleRowSelectForKeydown uses the current table instance.
  useEffect(() => {
    tableRef.current = table
  }, [table])

  const { rows } = table.getRowModel()

  const handleRowContextMenu = useCallback(
    (rowId: string, rowIndex: number, e: ReactMouseEvent<HTMLTableRowElement>) => {
      if (!tableRef.current) return
      const row = rows[rowIndex]
      if (!row || row.original === undefined) return

      e.preventDefault()
      e.stopPropagation()

      const selectedIds = Object.keys(rowSelection)

      const nextSelectedRows = selectedIds.includes(rowId) ? selectedIds : [rowId]

      if (!selectedIds.includes(rowId)) {
        // convert array to RowSelectionState object
        const nextSelection: RowSelectionState = { [rowId]: true }
        onRowSelectionChange?.(nextSelection)
      }

      const menuItems = rowContextMenuBuilders.flatMap((builder) =>
        toMenuItems(
          builder(e as any, {
            rowId,
            rowIndex,
            row,
            selectedRows: nextSelectedRows,
            selectedTableRows: nextSelectedRows
              .map((selectedRowId) => table.getRowModel().rowsById[selectedRowId])
              .filter((selectedRow): selectedRow is Row<SimpleTableRow> => !!selectedRow),
            isSelected: nextSelectedRows.includes(rowId),
          }),
        ),
      )

      if (menuItems.length > 0) {
        showRowContextMenu(e as any, menuItems)
      }
    },
    [rowContextMenuBuilders, rows, rowSelection, onRowSelectionChange, showRowContextMenu],
  )

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
      onScroll={handleScroll}
      onClick={handleContainerClick}
      {...props}
      className={clsx(props.className, { isLoading, fitContent })}
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
                  onContextMenu={(e) => handleRowContextMenu(row.id, virtualRow.index, e)}
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
