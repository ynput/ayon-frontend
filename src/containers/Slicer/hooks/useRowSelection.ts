import { KeyboardEvent, MouseEvent, useCallback, useRef } from 'react'
import { Row } from '@tanstack/react-table'
import { useSlicerContext } from '@context/slicerContext'

interface UseRowSelectionProps<T> {
  rows: Row<T>[]
}

type RowEvent = MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>

function useRowSelection<T>({ rows }: UseRowSelectionProps<T>) {
  const { rowSelection, setRowSelection, onRowSelectionChange } = useSlicerContext()

  const lastRowSelected = useRef<Row<T> | null>(null)

  const handleRowSelect = useCallback(
    (event: RowEvent, row: Row<T>) => {
      const handleMultiSelect = () => {
        const newRowSelection = { ...rowSelection }
        if (newRowSelection[row.id]) {
          delete newRowSelection[row.id]
        } else {
          newRowSelection[row.id] = true
        }
        lastRowSelected.current = row
        return newRowSelection
      }

      const handleShiftSelect = () => {
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

        lastRowSelected.current = row

        return newRowSelection
      }

      const handleSingleSelect = () => {
        const newSelection = row.getIsSelected() ? {} : { [row.id]: true }
        lastRowSelected.current = row
        return newSelection
      }

      let newSelection = {}
      if (event.ctrlKey || event.metaKey) newSelection = handleMultiSelect()
      else if (event.shiftKey) newSelection = handleShiftSelect()
      else newSelection = handleSingleSelect()

      // update selection
      setRowSelection(newSelection)
      // call the callback
      onRowSelectionChange?.(newSelection)
    },
    [rows, rowSelection, setRowSelection, onRowSelectionChange],
  )

  return { handleRowSelect }
}

export default useRowSelection
