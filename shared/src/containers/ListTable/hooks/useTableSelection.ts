import { useCallback, useRef, useState } from 'react'
import { Row, RowData } from '@tanstack/react-table'
import { Virtualizer } from '@tanstack/react-virtual'

interface UseTableSelectionOptions<TData extends RowData> {
  rows: Row<TData>[]
  selectedRows: string[]
  onSelectedRowsChange?: (ids: string[]) => void
  multiSelection: boolean
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>
  tableContainerRef: React.RefObject<HTMLDivElement>
}

const isGroupRow = <TData extends RowData>(row: Row<TData>) => {
  return (
    row.getIsGrouped() ||
    (!!row.original && typeof row.original === 'object' && '__listTableGroup' in row.original)
  )
}

export function useTableSelection<TData extends RowData>({
  rows,
  selectedRows,
  onSelectedRowsChange,
  multiSelection,
  rowVirtualizer,
  tableContainerRef,
}: UseTableSelectionOptions<TData>) {
  const [activeRowIndex, setActiveRowIndex] = useState(-1)
  const lastSelectedIndexRef = useRef(-1)

  const handleRowClick = useCallback(
    (rowId: string, rowIndex: number, e: React.MouseEvent) => {
      const row = rows[rowIndex]
      if (row && isGroupRow(row)) return

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
      } else if (selectedRows.includes(rowId)) {
        onSelectedRowsChange?.(selectedRows.filter((id) => id !== rowId))
      } else {
        onSelectedRowsChange?.([rowId])
        lastSelectedIndexRef.current = rowIndex
      }
      setActiveRowIndex(rowIndex)
      tableContainerRef.current?.focus()
    },
    [selectedRows, rows, onSelectedRowsChange, multiSelection, tableContainerRef],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      e.preventDefault()

      const direction = e.key === 'ArrowDown' ? 1 : -1
      let currentIndex = activeRowIndex < 0 ? (direction > 0 ? -1 : rows.length) : activeRowIndex

      let newIndex = currentIndex
      while (true) {
        newIndex += direction
        if (newIndex < 0 || newIndex >= rows.length) {
          newIndex = Math.max(0, Math.min(rows.length - 1, newIndex))
          break
        }
        if (!isGroupRow(rows[newIndex])) {
          break
        }
      }

      if (newIndex === activeRowIndex || isGroupRow(rows[newIndex])) return

      const newRowId = rows[newIndex]?.id
      if (!newRowId) return

      if (e.shiftKey && multiSelection) {
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

  return { activeRowIndex, handleRowClick, handleKeyDown }
}
