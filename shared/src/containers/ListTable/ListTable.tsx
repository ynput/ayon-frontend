import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  type RowData,
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
import { useCreateContextMenu } from '../ContextMenu'
import { isCustomGroupRowValue } from './ListTableGroupRow'
import type { ListTableProps } from './ListTable.types'

export type {
  ListTableGroupDisplay,
  ListTableGroupingPathItem,
  ListTableProps,
  ListTableRowDoubleClickContext,
  ListTableRowDoubleClickHandler,
  ListTableRowContextMenuBuilder,
  ListTableRowContextMenuContext,
} from './ListTable.types'

const toMenuItems = (
  items: ReturnType<NonNullable<ListTableProps<RowData>['rowContextMenuBuilders']>[number]>,
) => {
  if (!items) return []
  return Array.isArray(items) ? items.filter(Boolean) : [items]
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
  editable = true,
  onReorderRows,
  rowContextMenuBuilders = [],
  onRowDoubleClick,
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
}: ListTableProps<TData>) {
  const [sortingLocal, setSortingLocal] = useState<SortingState>([])
  const [columnVisibilityLocal, setColumnVisibilityLocal] = useState<VisibilityState>({})
  const [columnSizingLocal, setColumnSizingLocal] = useState<ColumnSizingState>({})
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [showRowContextMenu] = useCreateContextMenu()

  // Use controlled sorting if provided, otherwise internal state
  const sorting = sortingProp ?? sortingLocal

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
    data,
    columns,
    getRowId,
    state: {
      columnOrder,
      sorting,
      columnVisibility,
      columnSizing,
    },
    filterFns: { fuzzy: () => true }, // Placeholder for fuzzy filtering
    onColumnOrderChange: setColumnOrder,
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onColumnSizingChange: handleColumnSizingChange,
    enableSorting,
    columnResizeMode: 'onEnd',
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getSubRows: (row: any) => row.subRows,
    getRowCanExpand: (row) => row.subRows.length > 0,
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

  const handleRowDoubleClick = useCallback(
    (rowId: string, rowIndex: number, e: React.MouseEvent<HTMLTableRowElement>) => {
      if (!onRowDoubleClick) return

      const row = rows[rowIndex]
      if (!row || row.original === undefined || isCustomGroupRowValue(row.original)) return

      onRowDoubleClick(e, {
        rowId,
        rowIndex,
        row,
        isSelected: selectedRows.includes(rowId),
      })
    },
    [onRowDoubleClick, rows, selectedRows],
  )

  const handleRowContextMenu = useCallback(
    (rowId: string, rowIndex: number, e: React.MouseEvent<HTMLTableRowElement>) => {
      const row = rows[rowIndex]
      if (!row || row.original === undefined) return
      const isGroupRow = isCustomGroupRowValue(row.original)
      let groupContext: { groupColumnId?: string; groupValue?: unknown } = {}
      if (isGroupRow) {
        const customGroupRow = row.original as { __groupColumnId: string; __groupValue: unknown }
        groupContext = {
          groupColumnId: customGroupRow.__groupColumnId,
          groupValue: customGroupRow.__groupValue,
        }
      }

      e.preventDefault()
      e.stopPropagation()

      const nextSelectedRows = isGroupRow
        ? selectedRows
        : selectedRows.includes(rowId)
        ? selectedRows
        : [rowId]
      if (!isGroupRow && !selectedRows.includes(rowId)) {
        onSelectedRowsChange?.(nextSelectedRows)
      }

      const menuItems = rowContextMenuBuilders.flatMap((builder) =>
        toMenuItems(
          builder(e, {
            rowId,
            rowIndex,
            row,
            selectedRows: nextSelectedRows,
            isSelected: nextSelectedRows.includes(rowId),
            isGroupRow,
            ...groupContext,
          }),
        ),
      )

      if (menuItems.length > 0) {
        showRowContextMenu(e, menuItems)
      }
    },
    [rowContextMenuBuilders, rows, selectedRows, onSelectedRowsChange, showRowContextMenu],
  )

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
                    onRowDoubleClick={onRowDoubleClick ? handleRowDoubleClick : undefined}
                    onRowContextMenu={
                      rowContextMenuBuilders.length > 0 ? handleRowContextMenu : undefined
                    }
                    cellWrapper={cellWrapper}
                    columnAttributeData={columnAttributeData}
                    dataTypeWidgets={dataTypeWidgets}
                    editingState={editingState}
                    callbacks={callbacks}
                    editable={editable}
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
                      editable={editable}
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
