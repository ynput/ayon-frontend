import React, { useEffect, useRef, useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  RowData,
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
import type { ListTableProps } from './ListTable.types'

export type { ListTableProps }

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
}: ListTableProps<TData>) {
  const [grouping, setGrouping] = React.useState<string[]>([])
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // --- Column order ---
  const { columnOrder, setColumnOrder } = useTableColumnOrder(columns, columnOrderProp)

  // --- Table Instance ---
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: { grouping, columnOrder },
    filterFns: { fuzzy: () => true }, // Placeholder for fuzzy filtering
    onGroupingChange: setGrouping,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
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
  } = useTableDnd({ rows, onReorderRows, setColumnOrder, onColumnOrderChange })

  // Memoize stable callbacks so React.memo on DraggableRow can bail out during column drag
  const callbacks = useMemo(() => ({ onUpdateRow, onOpenViewer }), [onUpdateRow, onOpenViewer])

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
    <Styled.TableContainer ref={tableContainerRef} tabIndex={0} onKeyDown={handleKeyDown}>
      <Styled.Table>
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
