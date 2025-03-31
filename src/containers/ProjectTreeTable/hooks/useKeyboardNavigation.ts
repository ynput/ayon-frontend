import { useCallback } from 'react'
import { useSelection } from '../context/SelectionContext'
import { useCellEditing } from '../context/CellEditingContext'
import { parseCellId, getCellId } from '../utils/cellUtils'

export default function useKeyboardNavigation() {
  const { focusedCellId, gridMap, selectCell, focusCell, clearSelection } = useSelection()

  const { setEditingCellId, editingCellId } = useCellEditing()

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Skip if event target is an input element or contentEditable
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.isContentEditable ||
          e.target.getAttribute('role') === 'textbox')
      ) {
        return
      }

      if (editingCellId) return

      // Don't handle keyboard events if we don't have a focused cell
      if (!focusedCellId) return

      const position = parseCellId(focusedCellId)
      if (!position) return

      const { rowId, colId } = position
      const rowIndex = gridMap.rowIdToIndex.get(rowId)
      const colIndex = gridMap.colIdToIndex.get(colId)

      if (rowIndex === undefined || colIndex === undefined) return

      // Handle different keys
      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault()
          if (rowIndex > 0) {
            const newRowId = gridMap.indexToRowId.get(rowIndex - 1)
            if (newRowId) {
              const newCellId = getCellId(newRowId, colId)
              selectCell(newCellId, e.shiftKey, e.shiftKey)
              focusCell(newCellId)
            }
          }
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          const newRowId = gridMap.indexToRowId.get(rowIndex + 1)
          if (newRowId) {
            const newCellId = getCellId(newRowId, colId)
            selectCell(newCellId, e.shiftKey, e.shiftKey)
            focusCell(newCellId)
          }
          break
        }
        case 'ArrowLeft': {
          e.preventDefault()
          if (colIndex > 0) {
            const newColId = gridMap.indexToColId.get(colIndex - 1)
            if (newColId) {
              const newCellId = getCellId(rowId, newColId)
              selectCell(newCellId, e.shiftKey, e.shiftKey)
              focusCell(newCellId)
            }
          }
          break
        }
        case 'ArrowRight': {
          e.preventDefault()
          const newColId = gridMap.indexToColId.get(colIndex + 1)
          if (newColId) {
            const newCellId = getCellId(rowId, newColId)
            selectCell(newCellId, e.shiftKey, e.shiftKey)
            focusCell(newCellId)
          }
          break
        }
        case 'Enter': {
          e.preventDefault()
          // Start editing the currently focused cell
          setEditingCellId(focusedCellId)
          break
        }
        case 'Tab': {
          e.preventDefault()
          // Move to next cell (right if no shift, left if shift)
          const nextColIndex = e.shiftKey ? colIndex - 1 : colIndex + 1
          const nextColId = gridMap.indexToColId.get(nextColIndex)

          if (nextColId) {
            // Move to next/prev column in same row
            const newCellId = getCellId(rowId, nextColId)
            selectCell(newCellId, false, false)
            focusCell(newCellId)
          } else if (!e.shiftKey && rowIndex < gridMap.rowIdToIndex.size - 1) {
            // Move to first column of next row
            const newRowId = gridMap.indexToRowId.get(rowIndex + 1)
            const firstColId = gridMap.indexToColId.get(0)
            if (newRowId && firstColId) {
              const newCellId = getCellId(newRowId, firstColId)
              selectCell(newCellId, false, false)
              focusCell(newCellId)
            }
          } else if (e.shiftKey && rowIndex > 0) {
            // Move to last column of previous row
            const newRowId = gridMap.indexToRowId.get(rowIndex - 1)
            const lastColId = gridMap.indexToColId.get(gridMap.colIdToIndex.size - 1)
            if (newRowId && lastColId) {
              const newCellId = getCellId(newRowId, lastColId)
              selectCell(newCellId, false, false)
              focusCell(newCellId)
            }
          }
          break
        }
      }
    },
    [
      focusedCellId,
      gridMap,
      selectCell,
      focusCell,
      clearSelection,
      setEditingCellId,
      editingCellId,
    ],
  )

  return { handleKeyDown }
}
