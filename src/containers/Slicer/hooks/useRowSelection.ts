import { KeyboardEvent, MouseEvent, useCallback, useRef } from 'react'
import { useSimpleTableContext } from '../../../../shared/src/SimpleTable/context/SimpleTableContext'
import { Row, Table } from '@tanstack/react-table'

interface UseRowSelectionProps<T> {
  table: Table<T>
  rows: Row<T>[]
}

type RowEvent = MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>

function useRowSelection<T>({ table, rows }: UseRowSelectionProps<T>) {
  const { rowSelection, setRowSelection, onRowSelectionChange } = useSimpleTableContext()

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

      // check if hasValue or noValue is involved
      const hasValueInvolved =
        row.id === 'hasValue' ||
        row.id === 'noValue' ||
        'noValue' in rowSelection ||
        'hasValue' in rowSelection

      if (hasValueInvolved) newSelection = handleSingleSelect()
      // always single select when dealing with hasValue or noValue
      else if (event.ctrlKey || event.metaKey) newSelection = handleMultiSelect()
      else if (event.shiftKey) newSelection = handleShiftSelect()
      else newSelection = handleSingleSelect()

      // update selection
      setRowSelection(newSelection)
      // call the callback
      onRowSelectionChange?.(newSelection, table)
    },
    [rowSelection, setRowSelection, onRowSelectionChange],
  )

  return { handleRowSelect }
}

export default useRowSelection
