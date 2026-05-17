import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  ColumnDef,
  ColumnOrderState,
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
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { DraggableRow } from './ListTableRow'
import { CellWrapperRenderer, RowCells } from './ListTableCell'
import * as Styled from './ListTable.styled'
import { ListTableColumnAttributeData, ListTableDataTypeWidgets } from './ListTableWidgets'

// 1. Extend TanStack Table Meta to strongly type our mutation and dialog handlers
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    listTableCustomCell?: boolean
  }

  interface TableMeta<TData extends RowData> {
    updateData: (columnId: string, value: unknown, rowIndex: number) => void
    openViewerDialog?: (row: TData) => void
  }
}

export interface ListTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  fetchNextPage?: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onUpdateRow: (columnId: string, value: unknown, rowIndex: number) => void
  onOpenViewer?: (row: TData) => void
  onReorderRows?: (startIndex: number, endIndex: number) => void
  selectedRows?: string[]
  onSelectedRowsChange?: (ids: string[]) => void
  multiSelection?: boolean
  cellWrapper?: CellWrapperRenderer<TData>
  columnAttributeData?: ListTableColumnAttributeData
  dataTypeWidgets?: ListTableDataTypeWidgets<TData>
}

export function ListTable<TData extends RowData>({
  data,
  columns,
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
}: ListTableProps<TData>) {
  // --- State Management ---
  const [grouping, setGrouping] = useState<string[]>([])
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() =>
    columns.map((c) => c.id as string),
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeRowIndex, setActiveRowIndex] = useState(-1)
  const [editingCellId, setEditingCellId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<string | null>(null)
  const lastSelectedIndexRef = useRef(-1)

  // --- Table Instance ---
  const table = useReactTable({
    data,
    columns,
    state: {
      grouping,
      columnOrder,
    },
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
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 44,
    overscan: 10,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()

  // --- Selection & Keyboard ---
  const handleRowClick = useCallback(
    (rowId: string, rowIndex: number, e: React.MouseEvent) => {
      if (multiSelection && e.shiftKey && lastSelectedIndexRef.current >= 0) {
        const start = Math.min(lastSelectedIndexRef.current, rowIndex)
        const end = Math.max(lastSelectedIndexRef.current, rowIndex)
        const rangeIds = rows.slice(start, end + 1).map((r) => r.id)
        if (e.metaKey || e.ctrlKey) {
          onSelectedRowsChange?.(Array.from(new Set([...selectedRows, ...rangeIds])))
        } else {
          onSelectedRowsChange?.(rangeIds)
        }
      } else if (multiSelection && (e.metaKey || e.ctrlKey)) {
        if (selectedRows.includes(rowId)) {
          onSelectedRowsChange?.(selectedRows.filter((id) => id !== rowId))
        } else {
          onSelectedRowsChange?.([...selectedRows, rowId])
        }
        lastSelectedIndexRef.current = rowIndex
      } else {
        onSelectedRowsChange?.([rowId])
        lastSelectedIndexRef.current = rowIndex
      }
      setActiveRowIndex(rowIndex)
      tableContainerRef.current?.focus()
    },
    [selectedRows, rows, onSelectedRowsChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      e.preventDefault()

      const direction = e.key === 'ArrowDown' ? 1 : -1
      const currentIndex = activeRowIndex < 0 ? (direction > 0 ? -1 : rows.length) : activeRowIndex
      const newIndex = Math.max(0, Math.min(rows.length - 1, currentIndex + direction))

      if (newIndex === activeRowIndex) return

      const newRowId = rows[newIndex]?.id
      if (!newRowId) return

      if (e.shiftKey) {
        if (selectedRows.includes(newRowId)) {
          // Shrink: deselect the row we're moving away from
          const currentRowId = rows[activeRowIndex]?.id
          if (currentRowId) {
            onSelectedRowsChange?.(selectedRows.filter((id) => id !== currentRowId))
          }
        } else {
          onSelectedRowsChange?.([...selectedRows, newRowId])
        }
      } else {
        onSelectedRowsChange?.([newRowId])
        lastSelectedIndexRef.current = newIndex
      }

      setActiveRowIndex(newIndex)
      rowVirtualizer.scrollToIndex(newIndex, { behavior: 'smooth' })
    },
    [activeRowIndex, rows, selectedRows, onSelectedRowsChange, rowVirtualizer],
  )

  useEffect(() => {
    const [lastItem] = virtualRows.slice(-1)
    if (!lastItem) return

    if (lastItem.index >= rows.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage?.()
    }
  }, [hasNextPage, fetchNextPage, rows.length, isFetchingNextPage, virtualRows])

  // --- Drag & Drop ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const activeRow = activeId ? rows.find((row) => row.id === activeId) : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = rows.findIndex((row) => row.id === active.id)
      const newIndex = rows.findIndex((row) => row.id === over.id)
      onReorderRows?.(oldIndex, newIndex)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const startEditingCell = useCallback((cellId: string) => {
    setEditingCellId(cellId)
  }, [])

  const stopEditingCell = useCallback(() => {
    setEditingCellId(null)
    setEditingDraft(null)
  }, [])

  const callbacks = {
    onUpdateRow,
    onOpenViewer,
  }

  const editingState = {
    editingCellId,
    startEditingCell,
    stopEditingCell,
    getDraftValue: () => editingDraft,
    setDraftValue: setEditingDraft,
  }

  return (
    <Styled.TableContainer ref={tableContainerRef} tabIndex={0} onKeyDown={handleKeyDown}>
      <Styled.Table>
        <Styled.THead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Styled.HeaderTR key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Styled.TH key={header.id} style={{ width: header.getSize() }}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </Styled.TH>
              ))}
            </Styled.HeaderTR>
          ))}
        </Styled.THead>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
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
                      style={{
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
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
