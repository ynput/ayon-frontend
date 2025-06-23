import { useCallback, useEffect } from 'react'
import { useSelectionCellsContext } from '../context/SelectionCellsContext'
import { useCellEditing } from '../context/CellEditingContext' // keep for editingCellId/setEditingCellId
import { parseCellId, getCellId } from '../utils/cellUtils'
import { useProjectTableContext } from '../context/ProjectTableContext'
import { getEntityViewierIds } from '../utils'

export default function useKeyboardNavigation() {
  const { attribFields, getEntityById, onOpenPlayer } = useProjectTableContext()

  const { focusedCellId, gridMap, selectCell, focusCell, clearSelection, setFocusedCellId } =
    useSelectionCellsContext()

  const { setEditingCellId, editingCellId } = useCellEditing()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (!target?.closest('table')) return

      // Skip if event target is an input element or contentEditable
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.getAttribute('role') === 'textbox' ||
        target.tagName === 'LI'
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

      const isReadOnly =
        colId.startsWith('attrib_') &&
        attribFields.find((a) => a.name === colId.replace('attrib_', ''))?.readOnly

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
          if (isReadOnly) return
          // Start editing the currently focused cell
          setEditingCellId(focusedCellId)
          break
        }
        case 'Escape': {
          e.preventDefault()
          // Clear selection and stop editing
          clearSelection()
          setEditingCellId(null)
          setFocusedCellId(null)
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
        case ' ': {
          e.preventDefault()
          // open the player if the function is available
          if (onOpenPlayer) {
            const entity = getEntityById(rowId)
            if (entity) {
              const targetIds = getEntityViewierIds(entity)
              onOpenPlayer(targetIds, { quickView: true })
            }
          }
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
      getEntityById,
    ],
  )

  // Attach the keydown event handler to the document
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    handleKeyDown,
    focusedCellId,
    gridMap,
    selectCell,
    focusCell,
    clearSelection,
    setEditingCellId,
    editingCellId,
  ])
  return {
    handleKeyDown,
    focusedCellId,
    gridMap,
    selectCell,
    focusCell,
    clearSelection,
    setEditingCellId,
    editingCellId,
  }
}
