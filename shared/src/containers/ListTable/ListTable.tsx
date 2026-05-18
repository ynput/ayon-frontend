import React, { useEffect, useRef, useMemo, useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  RowData,
  SortingState,
  VisibilityState,
  ColumnSizingState,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  horizontalListSortingStrategy,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { DraggableRow } from './ListTableRow'
import { RowCells } from './ListTableCell'
import * as Styled from './ListTable.styled'
import { SortableTHComponent } from './ListTableHeader'
import { useTableColumnOrder } from './hooks/useTableColumnOrder'
import { useTableSelection } from './hooks/useTableSelection'
import { useTableEditing } from './hooks/useTableEditing'
import { useTableDnd } from './hooks/useTableDnd'
import { useColumnWidthVars } from './hooks/useColumnWidthVars'
import type {
  ListTableGroupDisplay,
  ListTableGroupingPathItem,
  ListTableProps,
} from './ListTable.types'

export type { ListTableGroupDisplay, ListTableGroupingPathItem, ListTableProps }

type CustomGroupRow<TData> = {
  id: string
  __listTableGroup: true
  __groupColumnId: string
  __groupValue: ListTableGroupingPathItem
  __groupKey: string
  subRows: Array<CustomGroupRow<TData> | TData>
}

const isGroupDisplayObject = (value: unknown): value is ListTableGroupDisplay =>
  !!value &&
  typeof value === 'object' &&
  ('label' in (value as object) || 'value' in (value as object))

const getPathItemValue = (value: ListTableGroupingPathItem | undefined) =>
  isGroupDisplayObject(value) && 'value' in value ? value.value : value

const getComparableValue = (value: ListTableGroupingPathItem | undefined) => {
  if (isGroupDisplayObject(value)) {
    if ('sortIndex' in value && typeof value.sortIndex === 'number') return value.sortIndex
    if ('sortValue' in value && value.sortValue !== undefined) return value.sortValue
    if ('label' in value && value.label !== undefined) return value.label
    if ('value' in value) return value.value
  }
  return value
}

const compareGroupingPathItems = (
  left: ListTableGroupingPathItem | undefined,
  right: ListTableGroupingPathItem | undefined,
) => {
  const comparableLeft = getComparableValue(left)
  const comparableRight = getComparableValue(right)

  if (typeof comparableLeft === 'number' && typeof comparableRight === 'number') {
    return comparableLeft - comparableRight
  }

  return String(comparableLeft ?? '').localeCompare(String(comparableRight ?? ''), undefined, {
    sensitivity: 'base',
  })
}

const getColumnValue = <TData extends RowData>(
  row: TData,
  columnId: string,
  columns: ColumnDef<TData, any>[],
) => {
  const column = columns.find((item) => item.id === columnId)
  if (!column) return (row as Record<string, unknown>)[columnId]
  if ('accessorFn' in column && typeof column.accessorFn === 'function') {
    return column.accessorFn(row, 0)
  }
  if ('accessorKey' in column && typeof column.accessorKey === 'string') {
    return (row as Record<string, unknown>)[column.accessorKey]
  }
  return (row as Record<string, unknown>)[columnId]
}

const compareLeafRows = <TData extends RowData>(
  left: TData,
  right: TData,
  sorting: SortingState,
  columns: ColumnDef<TData, any>[],
) => {
  for (const sortItem of sorting) {
    const column = columns.find((item) => item.id === sortItem.id)
    let result = 0

    if (column && 'sortingFn' in column && typeof column.sortingFn === 'function') {
      result = column.sortingFn({ original: left } as any, { original: right } as any, sortItem.id)
    } else {
      const valueLeft = getColumnValue(left, sortItem.id, columns)
      const valueRight = getColumnValue(right, sortItem.id, columns)

      if (typeof valueLeft === 'number' && typeof valueRight === 'number') {
        result = valueLeft - valueRight
      } else {
        result = String(valueLeft ?? '').localeCompare(String(valueRight ?? ''), undefined, {
          sensitivity: 'base',
        })
      }
    }

    if (result !== 0) {
      return sortItem.desc ? -result : result
    }
  }

  return 0
}

const isCustomGroupRow = <TData extends RowData>(
  row: CustomGroupRow<TData> | TData,
): row is CustomGroupRow<TData> =>
  !!row && typeof row === 'object' && '__listTableGroup' in (row as object)

const sortCustomGroupRows = <TData extends RowData>(
  rows: Array<CustomGroupRow<TData> | TData>,
  groupSortByDesc: boolean,
) => {
  const groupRows = rows.filter(isCustomGroupRow)
  const leafRows = rows.filter((row) => !isCustomGroupRow(row))

  groupRows.sort((left, right) => {
    const result = compareGroupingPathItems(left.__groupValue, right.__groupValue)
    return groupSortByDesc ? -result : result
  })

  groupRows.forEach((row) => {
    row.subRows = sortCustomGroupRows(row.subRows, groupSortByDesc)
  })

  return [...groupRows, ...leafRows]
}

const buildCustomGroupedData = <TData extends RowData>(
  data: TData[],
  grouping: string[],
  columns: ColumnDef<TData, any>[],
  sorting: SortingState,
  groupSortByDesc: boolean,
  getGroupingPath?: (columnId: string, row: TData) => ListTableGroupingPathItem[] | undefined,
): Array<CustomGroupRow<TData> | TData> => {
  const insertRow = (
    rows: Array<CustomGroupRow<TData> | TData>,
    row: TData,
    groupingIds: string[],
    parentKey: string,
  ) => {
    if (!groupingIds.length) {
      rows.push(row)
      return
    }

    const [columnId, ...restGrouping] = groupingIds
    const segments = getGroupingPath?.(columnId, row) ?? [getColumnValue(row, columnId, columns)]
    const safeSegments = segments.length ? segments : [null]

    const insertSegments = (
      container: Array<CustomGroupRow<TData> | TData>,
      level: number,
      currentParentKey: string,
    ) => {
      const segment = safeSegments[level]
      const segmentValue = getPathItemValue(segment)
      const groupKey = `${currentParentKey}|${columnId}:${level}:${JSON.stringify(segmentValue)}`
      let groupRow = container.find(
        (item): item is CustomGroupRow<TData> =>
          isCustomGroupRow(item) && item.__groupKey === groupKey,
      )

      if (!groupRow) {
        groupRow = {
          id: groupKey,
          __listTableGroup: true,
          __groupColumnId: columnId,
          __groupValue: segment,
          __groupKey: groupKey,
          subRows: [],
        }
        container.push(groupRow)
      }

      if (level < safeSegments.length - 1) {
        insertSegments(groupRow.subRows, level + 1, groupKey)
        return
      }

      insertRow(groupRow.subRows, row, restGrouping, groupKey)
    }

    insertSegments(rows, 0, parentKey)
  }

  const leafSorting = sorting.filter((item) => !grouping.includes(item.id))
  const sortedLeafRows = [...data].sort((left, right) =>
    compareLeafRows(left, right, leafSorting, columns),
  )
  const groupedRows: Array<CustomGroupRow<TData> | TData> = []

  sortedLeafRows.forEach((row) => insertRow(groupedRows, row, grouping, 'root'))

  return sortCustomGroupRows(groupedRows, groupSortByDesc)
}

export function ListTable<TData extends RowData>({
  data,
  columns,
  getRowId,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  onUpdateRow,
  onOpenViewer,
  onReorderRows,
  selectedRows = [],
  onSelectedRowsChange,
  multiSelection = false,
  cellWrapper,
  columnAttributeData,
  dataTypeWidgets,
  enableColumnReordering = false,
  columnOrder: columnOrderProp,
  onColumnOrderChange,
  enableColumnVisibility = false,
  columnVisibility: columnVisibilityProp,
  onColumnVisibilityChange,
  enableColumnResizing = false,
  columnSizing: columnSizingProp,
  onColumnSizingChange,
  enableSorting = false,
  sorting: sortingProp,
  onSortingChange,
  grouping: groupingProp,
  onGroupingChange,
  groupSortByDesc = false,
  getGroupingPath,
  getGroupDisplay,
}: ListTableProps<TData>) {
  const [groupingLocal, setGroupingLocal] = React.useState<string[]>([])

  // Use controlled grouping if provided, otherwise internal state
  const grouping = groupingProp ?? groupingLocal
  const setGrouping = (updater: string[] | ((prev: string[]) => string[])) => {
    const next = typeof updater === 'function' ? updater(grouping) : updater
    setGroupingLocal(next)
    onGroupingChange?.(next)
  }
  const [sortingLocal, setSortingLocal] = useState<SortingState>([])
  const [columnVisibilityLocal, setColumnVisibilityLocal] = useState<VisibilityState>({})
  const [columnSizingLocal, setColumnSizingLocal] = useState<ColumnSizingState>({})
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Use controlled sorting if provided, otherwise internal state
  const sorting = sortingProp ?? sortingLocal
  const hasNestedGroupingPath = useMemo(
    () =>
      !!getGroupingPath &&
      grouping.some((columnId) =>
        data.some((row) => (getGroupingPath(columnId, row)?.length ?? 0) > 1),
      ),
    [data, getGroupingPath, grouping],
  )
  const customGroupedData = useMemo(
    () =>
      hasNestedGroupingPath
        ? buildCustomGroupedData(data, grouping, columns, sorting, groupSortByDesc, getGroupingPath)
        : data,
    [columns, data, getGroupingPath, groupSortByDesc, grouping, hasNestedGroupingPath, sorting],
  )
  const handleSortingChange = (updater: SortingState | ((prev: SortingState) => SortingState)) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater
    setSortingLocal(next)
    onSortingChange?.(next)
  }

  // Use controlled column visibility if provided, otherwise internal state
  const columnVisibility = columnVisibilityProp ?? columnVisibilityLocal
  const handleColumnVisibilityChange = (
    updater: VisibilityState | ((prev: VisibilityState) => VisibilityState),
  ) => {
    const next = typeof updater === 'function' ? updater(columnVisibility) : updater
    setColumnVisibilityLocal(next)
    onColumnVisibilityChange?.(next)
  }

  // Use controlled column sizing if provided, otherwise internal state
  const columnSizing = columnSizingProp ?? columnSizingLocal
  const handleColumnSizingChange = (
    updater: ColumnSizingState | ((prev: ColumnSizingState) => ColumnSizingState),
  ) => {
    const next = typeof updater === 'function' ? updater(columnSizing) : updater
    setColumnSizingLocal(next)
    onColumnSizingChange?.(next)
  }

  // --- Column order ---
  const { columnOrder, setColumnOrder } = useTableColumnOrder(columns, columnOrderProp)

  // --- Table Instance ---
  const table = useReactTable({
    data: customGroupedData as TData[],
    columns,
    getRowId,
    state: {
      grouping: hasNestedGroupingPath ? [] : grouping,
      columnOrder,
      sorting,
      columnVisibility,
      columnSizing,
    },
    groupedColumnMode: false,
    filterFns: { fuzzy: () => true }, // Placeholder for fuzzy filtering
    onGroupingChange: setGrouping,
    onColumnOrderChange: setColumnOrder,
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onColumnSizingChange: handleColumnSizingChange,
    enableSorting,
    columnResizeMode: 'onEnd',
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: hasNestedGroupingPath ? undefined : getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: hasNestedGroupingPath ? undefined : getSortedRowModel(),
    getSubRows: (row: any) => row.subRows,
    meta: {
      updateData: onUpdateRow,
      openViewerDialog: onOpenViewer,
    },
  })

  const { rows } = table.getRowModel()

  // --- Virtualization ---
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 44,
    overscan: 10,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()

  // --- Selection & Keyboard ---
  const { handleRowClick, handleKeyDown } = useTableSelection({
    rows,
    selectedRows,
    onSelectedRowsChange,
    multiSelection,
    rowVirtualizer,
    tableContainerRef,
  })

  // --- Editing ---
  const { editingState } = useTableEditing()

  // --- Drag & Drop ---
  const {
    sensors,
    activeRowId,
    activeColumnId,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnDragCancel,
    handleRowDragStart,
    handleRowDragEnd,
    handleRowDragCancel,
  } = useTableDnd({ rows, columnOrder, onReorderRows, setColumnOrder, onColumnOrderChange })

  // Memoize stable callbacks so React.memo on DraggableRow can bail out during column drag
  const callbacks = useMemo(() => ({ onUpdateRow, onOpenViewer }), [onUpdateRow, onOpenViewer])

  // --- CSS variable-based column widths (avoids row re-renders during resize) ---
  const columnSizeVars = useColumnWidthVars(table)

  const isResizingColumn = !!table.getState().columnSizingInfo.isResizingColumn
  // --- Infinite loading ---
  useEffect(() => {
    const [lastItem] = virtualRows.slice(-1)
    if (!lastItem) return
    if (lastItem.index >= rows.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage?.()
    }
  }, [hasNextPage, fetchNextPage, rows.length, isFetchingNextPage, virtualRows])

  const activeRow = activeRowId ? rows.find((row) => row.id === activeRowId) : null
  const activeColumnHeader = activeColumnId
    ? table.getHeaderGroups()[0]?.headers.find((h) => h.id === activeColumnId)
    : null

  return (
    <Styled.TableContainer
      ref={tableContainerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={isResizingColumn ? { cursor: 'col-resize' } : undefined}
    >
      <Styled.Table style={columnSizeVars as React.CSSProperties}>
        {/* Column DndContext — isolated so row useSortable hooks are unaffected during column drag */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleColumnDragStart}
          onDragEnd={handleColumnDragEnd}
          onDragCancel={handleColumnDragCancel}
          modifiers={[restrictToHorizontalAxis]}
        >
          <Styled.THead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Styled.HeaderTR key={headerGroup.id}>
                <SortableContext
                  items={headerGroup.headers.map((h) => h.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {headerGroup.headers.map((header) => (
                    <SortableTHComponent
                      key={header.id}
                      header={header}
                      enabled={enableColumnReordering}
                      enableSorting={enableSorting}
                      enableColumnVisibility={enableColumnVisibility}
                      enableColumnResizing={enableColumnResizing}
                    />
                  ))}
                </SortableContext>
              </Styled.HeaderTR>
            ))}
          </Styled.THead>
          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: { active: { opacity: '0.4' } },
              }),
            }}
          >
            {activeColumnHeader ? (
              <table>
                <thead>
                  <tr>
                    <Styled.DraggedColumnHeader style={{ width: activeColumnHeader.getSize() }}>
                      {activeColumnHeader.isPlaceholder
                        ? null
                        : flexRender(
                            activeColumnHeader.column.columnDef.header,
                            activeColumnHeader.getContext(),
                          )}
                    </Styled.DraggedColumnHeader>
                  </tr>
                </thead>
              </table>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Row DndContext — isolated so column drag doesn't trigger row useSortable re-renders */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleRowDragStart}
          onDragEnd={handleRowDragEnd}
          onDragCancel={handleRowDragCancel}
          modifiers={[restrictToVerticalAxis]}
        >
          <Styled.TBody style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            <SortableContext
              items={rows.map((row) => row.id)}
              strategy={verticalListSortingStrategy}
            >
              {virtualRows.map((virtualRow) => {
                const isLoaderRow = virtualRow.index > rows.length - 1

                if (isLoaderRow) {
                  return (
                    <Styled.LoaderTR
                      key="loader"
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <td>Loading more data...</td>
                    </Styled.LoaderTR>
                  )
                }

                const row = rows[virtualRow.index]
                return (
                  <DraggableRow
                    key={row.id}
                    row={row}
                    virtualRow={virtualRow}
                    isSelected={selectedRows.includes(row.id)}
                    rowIndex={virtualRow.index}
                    onRowClick={handleRowClick}
                    cellWrapper={cellWrapper}
                    columnAttributeData={columnAttributeData}
                    dataTypeWidgets={dataTypeWidgets}
                    editingState={editingState}
                    callbacks={callbacks}
                    getGroupDisplay={getGroupDisplay}
                  />
                )
              })}
            </SortableContext>
          </Styled.TBody>
          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: { active: { opacity: '0.4' } },
              }),
            }}
          >
            {activeRow ? (
              <table style={{ width: '100%' }}>
                <Styled.TBody>
                  <Styled.OverlayTR>
                    <RowCells
                      row={activeRow}
                      cellWrapper={cellWrapper}
                      columnAttributeData={columnAttributeData}
                      dataTypeWidgets={dataTypeWidgets}
                      editingState={editingState}
                      callbacks={callbacks}
                    />
                  </Styled.OverlayTR>
                </Styled.TBody>
              </table>
            ) : null}
          </DragOverlay>
        </DndContext>
      </Styled.Table>
    </Styled.TableContainer>
  )
}
