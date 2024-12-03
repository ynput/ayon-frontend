import { KeyboardEvent, MouseEvent, useCallback, useRef } from 'react'
import { Row, RowSelectionState, Table } from '@tanstack/react-table'
import { SliceDataItem, useSlicerContext } from '@context/slicerContext'

interface UseRowSelectionProps<T> {
  rows: Row<T>[]
  table: Table<T>
}

type RowEvent = MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>

function useRowSelection<T>({ rows, table }: UseRowSelectionProps<T>) {
  const { rowSelection, setRowSelection, onRowSelectionChange, setRowSelectionData } =
    useSlicerContext()

  const lastRowSelected = useRef<Row<T> | null>(null)

  const getSelectionData = (selection: RowSelectionState, table: Table<T>) => {
    // for each selected row, get the data
    const selectedRows = Object.keys(selection).reduce<Record<string, SliceDataItem>>((acc, id) => {
      const row = table.getRow(id)
      if (!row) return acc

      // @ts-ignore
      acc[id as string] = row.original.data as SliceDataItem
      return acc
    }, {})

    return selectedRows
  }

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
      onRowSelectionChange?.(newSelection)

      // get selection data
      const selectionData = getSelectionData(newSelection, table)
      setRowSelectionData(selectionData)
    },
    [rows, rowSelection, setRowSelection, onRowSelectionChange],
  )

  return { handleRowSelect }
}

export default useRowSelection
