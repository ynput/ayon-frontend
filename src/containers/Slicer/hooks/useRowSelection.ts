import { KeyboardEvent, MouseEvent, useCallback, useRef } from 'react'
import { Row, Table } from '@tanstack/react-table'
import { RowSelectionState } from '@tanstack/table-core'

interface UseRowSelectionProps<T> {
  table: Table<T>
  rows: Row<T>[]
  rowSelection: RowSelectionState
  setRowSelection: (value: RowSelectionState) => void
}

type RowEvent = MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>

function useRowSelection<T>({
  table,
  rows,
  rowSelection,
  setRowSelection,
}: UseRowSelectionProps<T>) {
  const lastRowSelected = useRef<Row<T> | null>(null)

  const handleRowSelect = useCallback(
    (event: RowEvent, row: Row<T>) => {
      const handleMultiSelect = () => {
        row.toggleSelected()
        lastRowSelected.current = row
      }

      const handleShiftSelect = () => {
        if (!row) return

        const lastIndex = lastRowSelected?.current?.index ?? row.index
        const [fromIndex, toIndex] = [
          Math.min(lastIndex, row.index),
          Math.max(lastIndex, row.index),
        ]

        const siblingRows = row.getParentRow()?.subRows ?? rows
        const newRowSelection = { ...rowSelection }

        siblingRows.slice(fromIndex, toIndex + 1).forEach((row) => {
          if (row?.id && !newRowSelection[row.id]) {
            newRowSelection[row.id] = true
          }
        })

        setRowSelection(newRowSelection)
      }

      const handleSingleSelect = () => {
        table.resetRowSelection(false)
        row.toggleSelected(true)
        lastRowSelected.current = row
      }

      if (event.ctrlKey || event.metaKey) handleMultiSelect()
      else if (event.shiftKey) handleShiftSelect()
      else handleSingleSelect()
    },
    [rows, rowSelection, setRowSelection],
  )

  return { handleRowSelect }
}

export default useRowSelection
